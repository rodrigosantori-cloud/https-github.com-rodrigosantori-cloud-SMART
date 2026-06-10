import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Desativa cache agressivo para evitar travamento em proxies corporativos ou necessidade de excluir cookies/cache reincidentes
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  const PORT = 3000;

  // Lazy check and fallback for GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Aviso: GEMINI_API_KEY não foi definida nas variáveis de ambiente.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Função auxiliar para tentar realizar geração com fallback automático (evita 503 do gemini-3.5-flash)
  async function generateContentWithFallback(params: {
    model: string;
    contents: string | any;
    config?: any;
  }) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Falha ao tentar com o modelo ${params.model}. Erro: ${err.message || err}`);
      if (params.model === "gemini-3.5-flash") {
        console.log("[Gemini Fallback] Ativando fallback para 'gemini-3.1-flash-lite'...");
        try {
          return await ai.models.generateContent({
            ...params,
            model: "gemini-3.1-flash-lite"
          });
        } catch (fallbackErr: any) {
          console.error("[Gemini Fallback] Erro terrível: Falha no fallback também. Erro:", fallbackErr.message || fallbackErr);
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  // Resposta estruturada para a validação SMART
  const smartResponseSchema = {
    type: Type.OBJECT,
    properties: {
      adherencePercentage: {
        type: Type.INTEGER,
        description: "Porcentagem total (0-100) de conformidade da meta proposta com a metodologia SMART inteira."
      },
      overallVerdict: {
        type: Type.STRING,
        description: "Um parecer construtivo e profissional em português avaliando os dados fornecidos."
      },
      criteria: {
        type: Type.OBJECT,
        description: "Feedback detalhado para cada uma das dimensões da metodologia SMART.",
        properties: {
          S: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome em português (ex: Specific / Específica)" },
              rating: { type: Type.STRING, description: "A avaliação qualitativa curta (ex: Excelente, Muito Bom, Precisa de Ajustes, Insuficiente)" },
              score: { type: Type.INTEGER, description: "Nota de 0 a 100 para este aspecto específico" },
              analysis: { type: Type.STRING, description: "Feedback em português detalhando se está claro ou se precisa de esclarecimentos." },
              suggestions: { type: Type.STRING, description: "Lista de propostas práticas em português de como tornar este critério perfeito." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          M: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome em português (ex: Measurable / Mensurável)" },
              rating: { type: Type.STRING, description: "Avaliação qualitativa curta" },
              score: { type: Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: Type.STRING, description: "Feedback detalhando como o progresso será acompanhado." },
              suggestions: { type: Type.STRING, description: "Propostas de métricas e KPIs." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          A: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome em português (ex: Ambitious / Ambiciosa)" },
              rating: { type: Type.STRING, description: "Avaliação qualitativa curta" },
              score: { type: Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: Type.STRING, description: "Análise sobre o desafio e a ambição descritos." },
              suggestions: { type: Type.STRING, description: "Sugestões de equilíbrio de desafio, recursos ou ambição." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          R: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome em português (ex: Relevant / Relevante)" },
              rating: { type: Type.STRING, description: "Avaliação qualitativa curta" },
              score: { type: Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: Type.STRING, description: "Feedback sobre o porquê de essa meta importar neste momento." },
              suggestions: { type: Type.STRING, description: "Ajuste fino de alinhamento com objetivos maiores." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          T: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome em português (ex: Time-bound / Temporal)" },
              rating: { type: Type.STRING, description: "Avaliação qualitativa curta" },
              score: { type: Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: Type.STRING, description: "Feedback sobre prazos, frequência ou cronograma demarcados." },
              suggestions: { type: Type.STRING, description: "Melhor definição de prazos e marcos." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          }
        },
        required: ["S", "M", "A", "R", "T"]
      },
      refinedGoal: {
        type: Type.STRING,
        description: "A meta final ideal consolidada em uma frase clara e fluída que satisfaça todos os quesitos SMART ao mesmo tempo."
      }
    },
    required: ["adherencePercentage", "overallVerdict", "criteria", "refinedGoal"]
  };

  // Endpoint para realizar a validação SMART
  app.post("/api/validate", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "A chave de API do Gemini (GEMINI_API_KEY) está ausente no servidor. Configure-a no painel lateral de Secrets."
        });
      }

      const { goal, s, m, a, r, t } = req.body;

      if (!goal || goal.trim() === "") {
        return res.status(400).json({ error: "É necessário fornecer um resumo ou título para a sua meta." });
      }

      const promptTemplate = `
      Você é um especialista em desenvolvimento organizacional que avalia metas profissionais e pessoais usando a metodologia SMART (Specific, Measurable, Ambitious, Relevant, Time-bound), onde 'A' significa Ambiciosa e viável.
      
      Avalie a meta geral descrita: "${goal}"
      
      O usuário forneceu os seguintes detalhes sobre cada uma das dimensões:
      - S (Específica): "${s ? s.trim() : "Não preenchido / Não fornecido pelo usuário"}"
      - M (Mensurável): "${m ? m.trim() : "Não preenchido / Não fornecido pelo usuário"}"
      - A (Ambiciosa): "${a ? a.trim() : "Não preenchido / Não fornecido pelo usuário"}"
      - R (Relevante): "${r ? r.trim() : "Não preenchido / Não fornecido pelo usuário"}"
      - T (Temporal): "${t ? t.trim() : "Não preenchido / Não fornecido pelo usuário"}"

      REGRAS DE AVALIAÇÃO:
      1. Se o usuário deixou algum campo em branco ou escreveu coisas sem nexo, atribua um score muito baixo para aquela dimensão (ex: de 0 a 15) e, na análise e sugestões, explique gentilmente o que está faltando e mostre como preencher de maneira correta baseado no contexto da meta.
      2. Calcule uma média geral ponderada de aderência (adherencePercentage) entre 0 e 100.
      3. Forneça análises de alto nível e propostas acionáveis de melhora para cada letra da sigla.
      4. Escreva a "refinedGoal": uma versão perfeitamente unificada da meta em uma única frase poderosa, detalhada, e de fácil leitura, que atenda a 100% dos quesitos SMART de forma exemplar.
      `;

       const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: promptTemplate,
        config: {
          responseMimeType: "application/json",
          responseSchema: smartResponseSchema,
          systemInstruction: "Aja como um mentor corporativo brilhante e motivador especialista em Metas SMART & OKRs. O 'A' deve ser avaliado no sentido de 'Ambiciosa' (Ambitious), isto é, desafiadora mas realista. Escreva feedbacks refinados, inspiradores, construtivos e 100% em português do Brasil."
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta em branco gerada pela IA.");
      }

      const parsedJSON = JSON.parse(responseText.trim());
      return res.json(parsedJSON);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({
        error: "Falha ao processar a validação da meta com o Gemini AI.",
        details: e.message
      });
    }
  });

  // Resposta estruturada para a proposição automática do SMART
  const proposeResponseSchema = {
    type: Type.OBJECT,
    properties: {
      s: {
        type: Type.STRING,
        description: "Frase para o campo Específica (S). O que exatamente será feito?"
      },
      m: {
        type: Type.STRING,
        description: "Frase para o campo Mensurável (M). Como isso será medido (números, KPIs, métricas)?"
      },
      a: {
        type: Type.STRING,
        description: "Frase para o campo Ambiciosa (A). Como isso desafia de forma realista e ambiciosa?"
      },
      r: {
        type: Type.STRING,
        description: "Frase para o campo Relevante (R). Qual a importância estratégica / por que importa?"
      },
      t: {
        type: Type.STRING,
        description: "Frase para o campo Temporal (T). Qual o prazo ideal ou cronograma?"
      }
    },
    required: ["s", "m", "a", "r", "t"]
  };

  // Endpoint para propor o preenchimento dos critérios SMART
  app.post("/api/propose-criteria", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "A chave de API do Gemini (GEMINI_API_KEY) está ausente no servidor. Configure-a no painel lateral de Secrets."
        });
      }

      const { goal } = req.body;

      if (!goal || goal.trim() === "") {
        return res.status(400).json({ error: "É necessário fornecer a meta resumida para gerar as proposições." });
      }

      const promptTemplate = `
      Você é um mentor especialista em Metas SMART & OKRs para o Carrefour DHO.
      Com base na seguinte meta resumida / ideia geral fornecida pelo usuário:
      "${goal}"

      Proponha frases estruturadas, inspiradoras e profissionais para preencher cada caixinha do método SMART:
      - S (Específica): Um detalhamento claro e específico de o que será realizado.
      - M (Mensurável): Como medir ou quantificar o sucesso dessa meta de forma realista.
      - A (Ambiciosa): Como essa meta é desafiadora, instigante e ambiciosa, mas ainda viável.
      - R (Relevante): Qual a relevância e impacto dessa meta para o indivíduo ou organização.
      - T (Temporal): Um prazo lógico ou cronograma adequado para esta meta.

      Escreva propostas curtas (uma única frase clara e direta para cada pilar), acionáveis, e diretamente preenchíveis nos inputs, em português do Brasil, voltadas para o ambiente corporativo e de desenvolvimento de alta performance.
      `;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: promptTemplate,
        config: {
          responseMimeType: "application/json",
          responseSchema: proposeResponseSchema,
          systemInstruction: "Aja como um mentor corporativo excelente no Carrefour DHO. Forneça propostas de preenchimento de uma única frase direta para cada pilar do SMART, 150% em português do Brasil, de forma inspiradora e profissional."
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta em branco gerada pela IA.");
      }

      const parsedJSON = JSON.parse(responseText.trim());
      return res.json(parsedJSON);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({
        error: "Falha ao propor critérios com o Gemini AI.",
        details: e.message
      });
    }
  });

  // Configuração do Vite Middleware no desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running directly on container port ${PORT}`);
  });
}

startServer();

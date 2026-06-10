var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });
  const PORT = 3e3;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Aviso: GEMINI_API_KEY n\xE3o foi definida nas vari\xE1veis de ambiente.");
  }
  const ai = new import_genai.GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  async function generateContentWithFallback(params) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      console.warn(`[Gemini Fallback] Falha ao tentar com o modelo ${params.model}. Erro: ${err.message || err}`);
      if (params.model === "gemini-3.5-flash") {
        console.log("[Gemini Fallback] Ativando fallback para 'gemini-3.1-flash-lite'...");
        try {
          return await ai.models.generateContent({
            ...params,
            model: "gemini-3.1-flash-lite"
          });
        } catch (fallbackErr) {
          console.error("[Gemini Fallback] Erro terr\xEDvel: Falha no fallback tamb\xE9m. Erro:", fallbackErr.message || fallbackErr);
          throw fallbackErr;
        }
      }
      throw err;
    }
  }
  const smartResponseSchema = {
    type: import_genai.Type.OBJECT,
    properties: {
      adherencePercentage: {
        type: import_genai.Type.INTEGER,
        description: "Porcentagem total (0-100) de conformidade da meta proposta com a metodologia SMART inteira."
      },
      overallVerdict: {
        type: import_genai.Type.STRING,
        description: "Um parecer construtivo e profissional em portugu\xEAs avaliando os dados fornecidos."
      },
      criteria: {
        type: import_genai.Type.OBJECT,
        description: "Feedback detalhado para cada uma das dimens\xF5es da metodologia SMART.",
        properties: {
          S: {
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING, description: "Nome em portugu\xEAs (ex: Specific / Espec\xEDfica)" },
              rating: { type: import_genai.Type.STRING, description: "A avalia\xE7\xE3o qualitativa curta (ex: Excelente, Muito Bom, Precisa de Ajustes, Insuficiente)" },
              score: { type: import_genai.Type.INTEGER, description: "Nota de 0 a 100 para este aspecto espec\xEDfico" },
              analysis: { type: import_genai.Type.STRING, description: "Feedback em portugu\xEAs detalhando se est\xE1 claro ou se precisa de esclarecimentos." },
              suggestions: { type: import_genai.Type.STRING, description: "Lista de propostas pr\xE1ticas em portugu\xEAs de como tornar este crit\xE9rio perfeito." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          M: {
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING, description: "Nome em portugu\xEAs (ex: Measurable / Mensur\xE1vel)" },
              rating: { type: import_genai.Type.STRING, description: "Avalia\xE7\xE3o qualitativa curta" },
              score: { type: import_genai.Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: import_genai.Type.STRING, description: "Feedback detalhando como o progresso ser\xE1 acompanhado." },
              suggestions: { type: import_genai.Type.STRING, description: "Propostas de m\xE9tricas e KPIs." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          A: {
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING, description: "Nome em portugu\xEAs (ex: Ambitious / Ambiciosa)" },
              rating: { type: import_genai.Type.STRING, description: "Avalia\xE7\xE3o qualitativa curta" },
              score: { type: import_genai.Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: import_genai.Type.STRING, description: "An\xE1lise sobre o desafio e a ambi\xE7\xE3o descritos." },
              suggestions: { type: import_genai.Type.STRING, description: "Sugest\xF5es de equil\xEDbrio de desafio, recursos ou ambi\xE7\xE3o." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          R: {
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING, description: "Nome em portugu\xEAs (ex: Relevant / Relevante)" },
              rating: { type: import_genai.Type.STRING, description: "Avalia\xE7\xE3o qualitativa curta" },
              score: { type: import_genai.Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: import_genai.Type.STRING, description: "Feedback sobre o porqu\xEA de essa meta importar neste momento." },
              suggestions: { type: import_genai.Type.STRING, description: "Ajuste fino de alinhamento com objetivos maiores." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          },
          T: {
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING, description: "Nome em portugu\xEAs (ex: Time-bound / Temporal)" },
              rating: { type: import_genai.Type.STRING, description: "Avalia\xE7\xE3o qualitativa curta" },
              score: { type: import_genai.Type.INTEGER, description: "Nota de 0 a 100" },
              analysis: { type: import_genai.Type.STRING, description: "Feedback sobre prazos, frequ\xEAncia ou cronograma demarcados." },
              suggestions: { type: import_genai.Type.STRING, description: "Melhor defini\xE7\xE3o de prazos e marcos." }
            },
            required: ["name", "rating", "score", "analysis", "suggestions"]
          }
        },
        required: ["S", "M", "A", "R", "T"]
      },
      refinedGoal: {
        type: import_genai.Type.STRING,
        description: "A meta final ideal consolidada em uma frase clara e flu\xEDda que satisfa\xE7a todos os quesitos SMART ao mesmo tempo."
      }
    },
    required: ["adherencePercentage", "overallVerdict", "criteria", "refinedGoal"]
  };
  app.post("/api/validate", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "A chave de API do Gemini (GEMINI_API_KEY) est\xE1 ausente no servidor. Configure-a no painel lateral de Secrets."
        });
      }
      const { goal, s, m, a, r, t } = req.body;
      if (!goal || goal.trim() === "") {
        return res.status(400).json({ error: "\xC9 necess\xE1rio fornecer um resumo ou t\xEDtulo para a sua meta." });
      }
      const promptTemplate = `
      Voc\xEA \xE9 um especialista em desenvolvimento organizacional que avalia metas profissionais e pessoais usando a metodologia SMART (Specific, Measurable, Ambitious, Relevant, Time-bound), onde 'A' significa Ambiciosa e vi\xE1vel.
      
      Avalie a meta geral descrita: "${goal}"
      
      O usu\xE1rio forneceu os seguintes detalhes sobre cada uma das dimens\xF5es:
      - S (Espec\xEDfica): "${s ? s.trim() : "N\xE3o preenchido / N\xE3o fornecido pelo usu\xE1rio"}"
      - M (Mensur\xE1vel): "${m ? m.trim() : "N\xE3o preenchido / N\xE3o fornecido pelo usu\xE1rio"}"
      - A (Ambiciosa): "${a ? a.trim() : "N\xE3o preenchido / N\xE3o fornecido pelo usu\xE1rio"}"
      - R (Relevante): "${r ? r.trim() : "N\xE3o preenchido / N\xE3o fornecido pelo usu\xE1rio"}"
      - T (Temporal): "${t ? t.trim() : "N\xE3o preenchido / N\xE3o fornecido pelo usu\xE1rio"}"

      REGRAS DE AVALIA\xC7\xC3O:
      1. Se o usu\xE1rio deixou algum campo em branco ou escreveu coisas sem nexo, atribua um score muito baixo para aquela dimens\xE3o (ex: de 0 a 15) e, na an\xE1lise e sugest\xF5es, explique gentilmente o que est\xE1 faltando e mostre como preencher de maneira correta baseado no contexto da meta.
      2. Calcule uma m\xE9dia geral ponderada de ader\xEAncia (adherencePercentage) entre 0 e 100.
      3. Forne\xE7a an\xE1lises de alto n\xEDvel e propostas acion\xE1veis de melhora para cada letra da sigla.
      4. Escreva a "refinedGoal": uma vers\xE3o perfeitamente unificada da meta em uma \xFAnica frase poderosa, detalhada, e de f\xE1cil leitura, que atenda a 100% dos quesitos SMART de forma exemplar.
      `;
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: promptTemplate,
        config: {
          responseMimeType: "application/json",
          responseSchema: smartResponseSchema,
          systemInstruction: "Aja como um mentor corporativo brilhante e motivador especialista em Metas SMART & OKRs. O 'A' deve ser avaliado no sentido de 'Ambiciosa' (Ambitious), isto \xE9, desafiadora mas realista. Escreva feedbacks refinados, inspiradores, construtivos e 100% em portugu\xEAs do Brasil."
        }
      });
      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta em branco gerada pela IA.");
      }
      const parsedJSON = JSON.parse(responseText.trim());
      return res.json(parsedJSON);
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        error: "Falha ao processar a valida\xE7\xE3o da meta com o Gemini AI.",
        details: e.message
      });
    }
  });
  const proposeResponseSchema = {
    type: import_genai.Type.OBJECT,
    properties: {
      s: {
        type: import_genai.Type.STRING,
        description: "Frase para o campo Espec\xEDfica (S). O que exatamente ser\xE1 feito?"
      },
      m: {
        type: import_genai.Type.STRING,
        description: "Frase para o campo Mensur\xE1vel (M). Como isso ser\xE1 medido (n\xFAmeros, KPIs, m\xE9tricas)?"
      },
      a: {
        type: import_genai.Type.STRING,
        description: "Frase para o campo Ambiciosa (A). Como isso desafia de forma realista e ambiciosa?"
      },
      r: {
        type: import_genai.Type.STRING,
        description: "Frase para o campo Relevante (R). Qual a import\xE2ncia estrat\xE9gica / por que importa?"
      },
      t: {
        type: import_genai.Type.STRING,
        description: "Frase para o campo Temporal (T). Qual o prazo ideal ou cronograma?"
      }
    },
    required: ["s", "m", "a", "r", "t"]
  };
  app.post("/api/propose-criteria", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "A chave de API do Gemini (GEMINI_API_KEY) est\xE1 ausente no servidor. Configure-a no painel lateral de Secrets."
        });
      }
      const { goal } = req.body;
      if (!goal || goal.trim() === "") {
        return res.status(400).json({ error: "\xC9 necess\xE1rio fornecer a meta resumida para gerar as proposi\xE7\xF5es." });
      }
      const promptTemplate = `
      Voc\xEA \xE9 um mentor especialista em Metas SMART & OKRs para o Carrefour DHO.
      Com base na seguinte meta resumida / ideia geral fornecida pelo usu\xE1rio:
      "${goal}"

      Proponha frases estruturadas, inspiradoras e profissionais para preencher cada caixinha do m\xE9todo SMART:
      - S (Espec\xEDfica): Um detalhamento claro e espec\xEDfico de o que ser\xE1 realizado.
      - M (Mensur\xE1vel): Como medir ou quantificar o sucesso dessa meta de forma realista.
      - A (Ambiciosa): Como essa meta \xE9 desafiadora, instigante e ambiciosa, mas ainda vi\xE1vel.
      - R (Relevante): Qual a relev\xE2ncia e impacto dessa meta para o indiv\xEDduo ou organiza\xE7\xE3o.
      - T (Temporal): Um prazo l\xF3gico ou cronograma adequado para esta meta.

      Escreva propostas curtas (uma \xFAnica frase clara e direta para cada pilar), acion\xE1veis, e diretamente preench\xEDveis nos inputs, em portugu\xEAs do Brasil, voltadas para o ambiente corporativo e de desenvolvimento de alta performance.
      `;
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: promptTemplate,
        config: {
          responseMimeType: "application/json",
          responseSchema: proposeResponseSchema,
          systemInstruction: "Aja como um mentor corporativo excelente no Carrefour DHO. Forne\xE7a propostas de preenchimento de uma \xFAnica frase direta para cada pilar do SMART, 150% em portugu\xEAs do Brasil, de forma inspiradora e profissional."
        }
      });
      const responseText = response.text;
      if (!responseText) {
        throw new Error("Resposta em branco gerada pela IA.");
      }
      const parsedJSON = JSON.parse(responseText.trim());
      return res.json(parsedJSON);
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        error: "Falha ao propor crit\xE9rios com o Gemini AI.",
        details: e.message
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running directly on container port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

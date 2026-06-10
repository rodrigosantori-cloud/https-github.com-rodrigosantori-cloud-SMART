import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Target, 
  BarChart3, 
  Award, 
  Compass, 
  Calendar, 
  Sparkles, 
  Copy, 
  CheckCircle, 
  RotateCcw, 
  Share2, 
  Info, 
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Printer,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SMARTGoalInput, SMARTResult } from "./types";

// Função helper para chamar a API REST do Gemini diretamente do navegador (para execução estática no GitHub Pages)
const callGeminiDirectly = async (apiKey: string, prompt: string, schema: any, systemInstruction: string) => {
  // Tentamos com o modelo gemini-2.5-flash ou similar
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Erro HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) {
        msg = parsed.error.message;
      }
    } catch (_) {}
    throw new Error(msg);
  }

  const resData = await response.json();
  const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("A Inteligência Artificial retornou uma resposta vazia.");
  }
  return JSON.parse(text.trim());
};

const clientProposeResponseSchema = {
  type: "object",
  properties: {
    s: { type: "string" },
    m: { type: "string" },
    a: { type: "string" },
    r: { type: "string" },
    t: { type: "string" }
  },
  required: ["s", "m", "a", "r", "t"]
};

const clientSmartResponseSchema = {
  type: "object",
  properties: {
    adherencePercentage: { type: "integer" },
    overallVerdict: { type: "string" },
    criteria: {
      type: "object",
      properties: {
        S: {
          type: "object",
          properties: {
            name: { type: "string" },
            rating: { type: "string" },
            score: { type: "integer" },
            analysis: { type: "string" },
            suggestions: { type: "string" }
          },
          required: ["name", "rating", "score", "analysis", "suggestions"]
        },
        M: {
          type: "object",
          properties: {
            name: { type: "string" },
            rating: { type: "string" },
            score: { type: "integer" },
            analysis: { type: "string" },
            suggestions: { type: "string" }
          },
          required: ["name", "rating", "score", "analysis", "suggestions"]
        },
        A: {
          type: "object",
          properties: {
            name: { type: "string" },
            rating: { type: "string" },
            score: { type: "integer" },
            analysis: { type: "string" },
            suggestions: { type: "string" }
          },
          required: ["name", "rating", "score", "analysis", "suggestions"]
        },
        R: {
          type: "object",
          properties: {
            name: { type: "string" },
            rating: { type: "string" },
            score: { type: "integer" },
            analysis: { type: "string" },
            suggestions: { type: "string" }
          },
          required: ["name", "rating", "score", "analysis", "suggestions"]
        },
        T: {
          type: "object",
          properties: {
            name: { type: "string" },
            rating: { type: "string" },
            score: { type: "integer" },
            analysis: { type: "string" },
            suggestions: { type: "string" }
          },
          required: ["name", "rating", "score", "analysis", "suggestions"]
        }
      },
      required: ["S", "M", "A", "R", "T"]
    },
    refinedGoal: { type: "string" }
  },
  required: ["adherencePercentage", "overallVerdict", "criteria", "refinedGoal"]
};

// Definido fora do componente para máxima performance (estático, evita recriações)
const getScoreColor = (percent: number) => {
  if (percent >= 80) return { text: "text-crf-blue", bg: "bg-crf-blue-light", border: "border-crf-blue-light", stroke: "#003896" };
  if (percent >= 50) return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", stroke: "#f59e0b" };
  return { text: "text-crf-red", bg: "bg-crf-red-light", border: "border-crf-red-light", stroke: "#e10613" };
};

export default function App() {
  // Estado dos campos da meta
  const [inputs, setInputs] = useState<SMARTGoalInput>({
    goal: "",
    s: "",
    m: "",
    a: "",
    r: "",
    t: ""
  });

  // Outros estados do fluxo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SMARTResult | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [proposingProgress, setProposingProgress] = useState(0);
  const [proposingStepMsg, setProposingStepMsg] = useState("");
  const [clientApiKey, setClientApiKey] = useState(() => localStorage.getItem("gemini_client_api_key") || "");
  const [showKeyField, setShowKeyField] = useState(false);

  // Controla progresso simulado visual durante a análise da IA
  useEffect(() => {
    let timer: any = null;
    if (proposing) {
      setProposingProgress(12);
      setProposingStepMsg("Iniciando mentoria de DHO com Inteligência Artificial...");
      
      timer = setInterval(() => {
        setProposingProgress((prev) => {
          if (prev >= 92) return prev;
          const increment = Math.floor(Math.random() * 12) + 6;
          const next = prev + increment;
          
          if (next < 35) {
            setProposingStepMsg("Identificando a essência da sua meta e refinando...");
          } else if (next < 55) {
            setProposingStepMsg("Injetando parâmetros Específicos (S) e Mensuráveis (M)...");
          } else if (next < 75) {
            setProposingStepMsg("Calibrando o desafio sob a ótica Ambiciosa (A) e Relevante (R)...");
          } else {
            setProposingStepMsg("Estruturando prazos ideais no quadrante Temporal (T)...");
          }
          
          return Math.min(next, 92);
        });
      }, 500);
    } else {
      setProposingProgress(0);
      setProposingStepMsg("");
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [proposing]);

  // Carregar dados da URL caso existam (compartilhamento ou impressão)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedData = params.get("meta");
      if (sharedData) {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
        
        if (decoded && decoded.inputs) {
          // Novo formato: contém tanto as entradas quanto o diagnóstico analisado
          setInputs({
            goal: decoded.inputs.goal || "",
            s: decoded.inputs.s || "",
            m: decoded.inputs.m || "",
            a: decoded.inputs.a || "",
            r: decoded.inputs.r || "",
            t: decoded.inputs.t || ""
          });
          if (decoded.result) {
            setResult(decoded.result);
            
            // Caso seja para visualização estruturada de impressão, executa quando o componente monta
            if (params.get("print") === "true") {
              setTimeout(() => {
                window.print();
              }, 800); // Aguarda a renderização correta do progresso circular e animações
            }
          }
        } else if (decoded && decoded.goal) {
          // Formato antigo/compartilhado padrão: apenas inputs
          setInputs({
            goal: decoded.goal || "",
            s: decoded.s || "",
            m: decoded.m || "",
            a: decoded.a || "",
            r: decoded.r || "",
            t: decoded.t || ""
          });
        }

        // Remove the query parameters smoothly so reloading doesn't trap users in the old loaded state
        const cleanerUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanerUrl);
      }
    } catch (e) {
      console.warn("Não foi possível decodificar os parâmetros compartilhados.", e);
      // Limpeza de contingência em caso de travamentos causados por proxies corporativos modificando loops de URL
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (_) {}
    }
  }, []);

  // Controlar alteração dos campos (otimizado com useCallback)
  const handleInputChange = useCallback((field: keyof SMARTGoalInput, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar erro ao digitar
    setError(null);
  }, []);

  // Limpar todos os inputs (otimizado com useCallback)
  const handleReset = useCallback(() => {
    setInputs({
      goal: "",
      s: "",
      m: "",
      a: "",
      r: "",
      t: ""
    });
    setResult(null);
    setError(null);
    // Limpar parâmetro da URL de forma limpa
    window.history.pushState({}, document.title, window.location.pathname);
  }, []);

  // Chamar API de Validação no Backend ou Fallback do Cliente (otimizado com useCallback)
  const handleValidate = useCallback(async () => {
    if (!inputs.goal.trim()) {
      setError("Por favor, preencha pelo menos o resumo ou objetivo da Meta Geral no início do formulário.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let data;
      let usedClientFallback = false;

      // Se o usuário configurou uma chave cliente no navegador, priorizamos o uso dela
      if (clientApiKey) {
        try {
          const promptTemplate = `
          Você é um especialista em desenvolvimento organizacional que avalia metas profissionais e pessoais usando a metodologia SMART (Specific, Measurable, Ambitious, Relevant, Time-bound), onde 'A' significa Ambiciosa e viável.
          
          Avalie a meta geral descrita: "${inputs.goal}"
          
          O usuário forneceu os seguintes detalhes sobre cada uma das dimensões:
          - S (Específica): "${inputs.s ? inputs.s.trim() : "Não preenchido / Não fornecido pelo usuário"}"
          - M (Mensurável): "${inputs.m ? inputs.m.trim() : "Não preenchido / Não fornecido pelo usuário"}"
          - A (Ambiciosa): "${inputs.a ? inputs.a.trim() : "Não preenchido / Não fornecido pelo usuário"}"
          - R (Relevante): "${inputs.r ? inputs.r.trim() : "Não preenchido / Não fornecido pelo usuário"}"
          - T (Temporal): "${inputs.t ? inputs.t.trim() : "Não preenchido / Não fornecido pelo usuário"}"

          REGRAS DE AVALIAÇÃO:
          1. Se o usuário deixou algum campo em branco ou escreveu coisas sem nexo, atribua um score muito baixo para aquela dimensão (ex: de 0 a 15) e, na análise e sugestões, explique gentilmente o que está faltando e mostre como preencher de maneira correta baseado no contexto da meta.
          2. Calcule uma média geral ponderada de aderência (adherencePercentage) entre 0 e 100.
          3. Forneça análises de alto nível e propostas acionáveis de melhora para cada letra da sigla.
          4. Escreva a "refinedGoal": uma versão perfeitamente unificada da meta em uma única frase poderosa, detalhada, e de fácil leitura, que atenda a 100% dos quesitos SMART de forma exemplar.
          `;
          const sysIns = "Aja como um mentor corporativo brilhante e motivador especialista em Metas SMART & OKRs. O 'A' deve ser avaliado no sentido de 'Ambiciosa' (Ambitious), isto é, desafiadora mas realista. Escreva feedbacks refinados, inspiradores, construtivos e 100% em português do Brasil.";
          data = await callGeminiDirectly(clientApiKey, promptTemplate, clientSmartResponseSchema, sysIns);
          usedClientFallback = true;
        } catch (clientErr: any) {
          throw new Error(`Falha ao rodar com a Chave de API direta: ${clientErr.message}`);
        }
      }

      if (!usedClientFallback) {
        try {
          const response = await fetch("/api/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(inputs)
          });

          if (response.status === 404) {
            throw new Error("STATIC_PAGES_BACKEND_404");
          }

          data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Ocorreu um erro desconhecido na comunicação com a Inteligência Artificial.");
          }
        } catch (backendErr: any) {
          if (backendErr.message === "STATIC_PAGES_BACKEND_404" || backendErr.message?.includes("Failed to fetch")) {
            throw new Error("Esta página está rodando de forma estática no GitHub Pages (sem servidor backend ativo). Por favor, clique no botão 'Chave de API' no topo para configurar a sua chave pessoal do Gemini gratuitamente!");
          }
          throw backendErr;
        }
      }

      setResult(data);
      // Rolar de forma suave para os resultados
      setTimeout(() => {
        const resElement = document.getElementById("results_section");
        if (resElement) {
          resElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de rede ao conectar-se ao validador da meta. Certifique-se de configurar a API key do Gemini.");
    } finally {
      setLoading(false);
    }
  }, [inputs, clientApiKey]);

  // Copiar a meta unificada refinada (otimizado com useCallback)
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }, []);

  // Gerar link de compartilhamento real (otimizado com useCallback)
  const handleShareLink = useCallback(() => {
    try {
      const serialized = btoa(encodeURIComponent(JSON.stringify(inputs)));
      const shareUrl = `${window.location.origin}${window.location.pathname}?meta=${serialized}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.error(e);
    }
  }, [inputs]);

  // Chamar API de Propor Critérios automáticos via IA (otimizado com useCallback)
  const handleProposeCriteria = useCallback(async () => {
    if (!inputs.goal.trim()) {
      setError("Por favor, preencha primeiro a sua Meta Resumida ou Ideia Geral para que a IA possa propor as caixinhas SMART.");
      return;
    }

    setProposing(true);
    setError(null);

    try {
      let data;
      let usedClientFallback = false;

      if (clientApiKey) {
        try {
          const promptTemplate = `
          Você é um mentor especialista em Metas SMART & OKRs para o Carrefour DHO.
          Com base na seguinte meta resumida / ideia geral fornecida pelo usuário:
          "${inputs.goal}"

          Proponha frases estruturadas, inspiradoras e profissionais para preencher cada caixinha do método SMART:
          - S (Específica): Um detalhamento claro e específico de o que será realizado.
          - M (Mensurável): Como medir ou quantificar o sucesso dessa meta de forma realista.
          - A (Ambiciosa): Como essa meta é desafiadora, instigante e ambiciosa, mas ainda viável.
          - R (Relevante): Qual a relevância e impacto dessa meta para o indivíduo ou organização.
          - T (Temporal): Um prazo lógico ou cronograma adequado para esta meta.

          Escreva propostas curtas (uma única frase clara e direta para cada pilar), acionáveis, e diretamente preenchíveis nos inputs, em português do Brasil, voltadas para o ambiente corporativo e de desenvolvimento de alta performance.
          `;
          const sysIns = "Aja como um mentor corporativo excelente no Carrefour DHO. Forneça propostas de preenchimento de uma única frase direta para cada pilar do SMART, 150% em português do Brasil, de forma inspiradora e profissional.";
          data = await callGeminiDirectly(clientApiKey, promptTemplate, clientProposeResponseSchema, sysIns);
          usedClientFallback = true;
        } catch (clientErr: any) {
          throw new Error(`Falha ao propor com a Chave de API direta: ${clientErr.message}`);
        }
      }

      if (!usedClientFallback) {
        try {
          const response = await fetch("/api/propose-criteria", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ goal: inputs.goal })
          });

          if (response.status === 404) {
            throw new Error("STATIC_PAGES_BACKEND_404");
          }

          data = await response.json();

          if (!response.ok) {
            const errorMsg = data.details 
              ? `${data.error} (Motivo: ${data.details})` 
              : (data.error || "Ocorreu um erro ao gerar propostas para os critérios SMART.");
            throw new Error(errorMsg);
          }
        } catch (backendErr: any) {
          if (backendErr.message === "STATIC_PAGES_BACKEND_404" || backendErr.message?.includes("Failed to fetch")) {
            throw new Error("Este site está rodando estaticamente no GitHub Pages. Configure uma chave do Gemini no botão 'Chave de API' no topo para habilitar a geração automática!");
          }
          throw backendErr;
        }
      }

      setInputs(prev => ({
        ...prev,
        s: data.s || prev.s,
        m: data.m || prev.m,
        a: data.a || prev.a,
        r: data.r || prev.r,
        t: data.t || prev.t
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de rede ao conectar com a IA para propor critérios.");
    } finally {
      setProposing(false);
    }
  }, [inputs.goal, clientApiKey]);

  // Exportar relatório em formato de texto para DHO (otimizado com useCallback)
  const handleExportTxt = useCallback(() => {
    if (!result) return;
    const content = `====================================================
VALIDADOR DE METAS SMART - CARREFOUR DHO
RELATÓRIO DE DIAGNÓSTICO E PERFORMANCE DE META
====================================================

Meta Geral (Rascunho):
"${inputs.goal}"

SÍNTESE REFORMULADA (A SUA META SMART IDEAL):
"${result.refinedGoal}"

----------------------------------------------------
AVALIAÇÃO GERAL DO MENTOR:
Aderência Metodológica: ${result.adherencePercentage}%
Parecer: ${result.overallVerdict}
----------------------------------------------------

COMPARAÇÃO DETALHADA E RECOMENDAÇÕES DA FERRAMENTA:

S - Específica / Specific (Nota: ${result.criteria.S.score}/100 - ${result.criteria.S.rating})
- Meta preenchida na caixinha:
  "${inputs.s || "(Não preenchido)"}"
- Nova sugestão dada pela ferramenta:
  ${result.criteria.S.suggestions}

M - Mensurável / Measurable (Nota: ${result.criteria.M.score}/100 - ${result.criteria.M.rating})
- Meta preenchida na caixinha:
  "${inputs.m || "(Não preenchido)"}"
- Nova sugestão dada pela ferramenta:
  ${result.criteria.M.suggestions}

A - Ambiciosa / Ambitious (Nota: ${result.criteria.A.score}/100 - ${result.criteria.A.rating})
- Meta preenchida na caixinha:
  "${inputs.a || "(Não preenchido)"}"
- Nova sugestão dada pela ferramenta:
  ${result.criteria.A.suggestions}

R - Relevante / Relevant (Nota: ${result.criteria.R.score}/100 - ${result.criteria.R.rating})
- Meta preenchida na caixinha:
  "${inputs.r || "(Não preenchido)"}"
- Nova sugestão dada pela ferramenta:
  ${result.criteria.R.suggestions}

T - Temporal / Time-bound (Nota: ${result.criteria.T.score}/100 - ${result.criteria.T.rating})
- Meta preenchida na caixinha:
  "${inputs.t || "(Não preenchido)"}"
- Nova sugestão dada pela ferramenta:
  ${result.criteria.T.suggestions}

----------------------------------------------------
AVALIAÇÃO ANALÍTICA DO MENTOR SOBRE CADA CRITÉRIO:
- S (Específica): ${result.criteria.S.analysis}
- M (Mensurável): ${result.criteria.M.analysis}
- A (Ambiciosa): ${result.criteria.A.analysis}
- R (Relevante): ${result.criteria.R.analysis}
- T (Temporal): ${result.criteria.T.analysis}

----------------------------------------------------
Relatório gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}
Metodologia SMART • Carrefour Desenvolvimento Humano e Organizacional (DHO)
====================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Relatorio_Meta_SMART_Carrefour_DHO.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result, inputs]);

  const currentScorePreset = result ? getScoreColor(result.adherencePercentage) : { text: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", stroke: "#94a3b8" };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 selection:bg-crf-blue-light selection:text-crf-blue">
      
      {/* Cabeçalho Minimalista e Enxuto */}
      <header className="bg-white border-b border-slate-150 py-8 px-4 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crf-blue via-crf-blue to-crf-red text-white flex items-center justify-center font-black text-xl tracking-tight shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Validador de Metas SMART - Carrefour DHO
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Insira suas metas e valide cada letra do método de forma inteligente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyField(!showKeyField)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                clientApiKey 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100" 
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              }`}
              title="Configurar chave do Gemini para rodar estaticamente"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {clientApiKey ? "Gemini Direct: Ativo" : "Chave de API / GitHub Pages"}
            </button>

            <div className="flex items-center gap-1.5 bg-slate-105 p-1 rounded-lg">
              {["S", "M", "A", "R", "T"].map((letter, idx) => {
                const bgClass = idx % 2 === 0 ? "text-crf-blue" : "text-crf-red";
                return (
                  <span key={letter} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono bg-white shadow-xs ${bgClass}`}>
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Painel Configurador de Chave de API Cliente (Para rodar estático no GitHub Pages) */}
      <AnimatePresence>
        {showKeyField && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-100 border-b border-slate-200 overflow-hidden print:hidden"
          >
            <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Configurar Chave do Gemini (Execução Direta / GitHub Pages)
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed max-w-xl">
                  Se você estiver acessando este site de forma estática no GitHub Pages (onde o servidor não está ativo),
                  insira sua chave pessoal gratuita do Gemini abaixo para habilitar a geração e análise das metas.
                  Sua chave ficará guardada de forma segura na memória privada do seu próprio navegador.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="password"
                  placeholder="Cole sua API Key do Gemini aqui..."
                  value={clientApiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClientApiKey(val);
                    if (val) {
                      localStorage.setItem("gemini_client_api_key", val.trim());
                    } else {
                      localStorage.removeItem("gemini_client_api_key");
                    }
                  }}
                  className="w-full md:w-72 px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-crf-blue bg-white font-mono text-[11px]"
                />
                {clientApiKey && (
                  <button
                    onClick={() => {
                      setClientApiKey("");
                      localStorage.removeItem("gemini_client_api_key");
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container Principal */}
      <main className="max-w-4xl mx-auto px-4 mt-8 relative z-20 print:mt-2">

        {/* Formulário Principal */}
        <section className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8 print:hidden" id="form_section">
          {/* Cabeçalho do Formulário */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-crf-blue" />
                Construção da sua Meta
              </h3>
              <p className="text-xs text-slate-500 mt-1">Preencha os dados abaixo. Quanto mais detalhes fornecer para cada letra, mais preciso será o feedback do validador.</p>
            </div>
            
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200 transition-colors cursor-pointer"
                title="Limpar todos os campos"
                id="reset_button"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Campos
              </button>
              
              <button
                onClick={handleShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-crf-blue-light text-crf-blue border border-crf-blue-light/55 text-xs font-semibold hover:bg-crf-blue/10 hover:text-crf-blue-hover transition-colors cursor-pointer"
                title="Criar e copiar um link desta página com seus dados preenchidos"
                id="share_button"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? "Link Copiado!" : "Compartilhar Link"}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Meta Geral - Unificado */}
            <div className="bg-crf-blue-light/20 rounded-xl border border-crf-blue/10 p-4 relative">
              <div className="flex items-start justify-between gap-3 mb-2">
                <label className="block text-sm font-bold text-slate-800" htmlFor="goal_main">
                  Meta Resumida ou Ideia Geral <span className="text-crf-red">*</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-crf-blue-light text-crf-blue font-semibold font-mono uppercase">Introdução</span>
              </div>
              <textarea
                id="goal_main"
                value={inputs.goal}
                onChange={(e) => handleInputChange("goal", e.target.value)}
                placeholder="Exemplo rápido: Quero expandir o faturamento da minha loja de roupas online ou Gostaria de começar a correr nos finais de semana."
                rows={2}
                className="w-full text-slate-800 bg-white placeholder-slate-400 border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-hidden focus:border-crf-blue focus:ring-1 focus:ring-crf-blue transition-all font-medium"
              ></textarea>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-crf-blue/10">
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                  Essa é a sua meta antes do alinhamento. Toque à direita para sugerir o preenchimento de cada critério por IA!
                </p>
                <button
                  type="button"
                  onClick={handleProposeCriteria}
                  disabled={proposing || !inputs.goal.trim()}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-crf-blue text-white hover:bg-crf-blue-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-black transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  id="propose_criteria_button"
                >
                  {proposing ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-current inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Gerando proposta...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Fazer analise SMART
                    </>
                  )}
                </button>
              </div>

              {proposing && (
                <div className="mt-4 p-3.5 bg-white border border-slate-100 rounded-lg shadow-2xs space-y-2 animate-pulse">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-crf-blue flex items-center gap-2">
                      <svg className="animate-spin h-3 w-3 text-crf-blue inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {proposingStepMsg}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500">{proposingProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-crf-blue to-crf-blue/80 transition-all duration-500 rounded-full"
                      style={{ width: `${proposingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-dashed border-slate-200 pb-2 flex items-center justify-between">
                <span>Parâmetros Detalhados do Método</span>
                <span className="text-[10px] font-medium lowercase">Opcionais, mas recomendados</span>
              </h4>

              {/* S - Específica */}
              <div className="group relative border border-slate-150 rounded-xl p-4 hover:border-crf-blue/30 hover:bg-slate-50/30 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-crf-blue-light text-crf-blue flex items-center justify-center font-bold font-mono text-base">S</span>
                    <label className="text-sm font-bold text-slate-800" htmlFor="s_field">
                      Specific (Específica)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">O que você vai realizar exatamente?</span>
                </div>
                <input
                  id="s_field"
                  type="text"
                  value={inputs.s}
                  onChange={(e) => handleInputChange("s", e.target.value)}
                  placeholder="Quem será envolvido, o que será feito, onde, quais limites?"
                  className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:border-crf-blue transition-all"
                />
              </div>

              {/* M - Mensurável */}
              <div className="group relative border border-slate-150 rounded-xl p-4 hover:border-crf-red/30 hover:bg-slate-50/30 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-crf-red-light text-crf-red flex items-center justify-center font-bold font-mono text-base">M</span>
                    <label className="text-sm font-bold text-slate-800" htmlFor="m_field">
                      Measurable (Mensurável)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Como vai medir o progresso?</span>
                </div>
                <input
                  id="m_field"
                  type="text"
                  value={inputs.m}
                  onChange={(e) => handleInputChange("m", e.target.value)}
                  placeholder="Métricas numéricas, percentuais, ferramentas de medição, relatórios?"
                  className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:border-crf-red transition-all"
                />
              </div>

              {/* A - Ambiciosa */}
              <div className="group relative border border-slate-150 rounded-xl p-4 hover:border-crf-blue/30 hover:bg-slate-50/30 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-crf-blue-light text-crf-blue flex items-center justify-center font-bold font-mono text-base">A</span>
                    <label className="text-sm font-bold text-slate-800" htmlFor="a_field">
                      Ambitious (Ambiciosa)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium font-semibold text-rose-600">A meta te desafia de forma ambiciosa, embora factível?</span>
                </div>
                <input
                  id="a_field"
                  type="text"
                  value={inputs.a}
                  onChange={(e) => handleInputChange("a", e.target.value)}
                  placeholder="Como essa meta representa um desafio instigante e ambicioso para você ou para a organização?"
                  className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:border-crf-blue transition-all"
                />
              </div>

              {/* R - Relevante */}
              <div className="group relative border border-slate-150 rounded-xl p-4 hover:border-crf-red/30 hover:bg-slate-50/30 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-crf-red-light text-crf-red flex items-center justify-center font-bold font-mono text-base">R</span>
                    <label className="text-sm font-bold text-slate-800" htmlFor="r_field">
                      Relevant (Relevante)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Por que esta meta importa agora?</span>
                </div>
                <input
                  id="r_field"
                  type="text"
                  value={inputs.r}
                  onChange={(e) => handleInputChange("r", e.target.value)}
                  placeholder="Qual o impacto real desse resultado? De que forma se alinha com seus outros planos?"
                  className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:border-crf-red transition-all"
                />
              </div>

              {/* T - Temporal */}
              <div className="group relative border border-slate-150 rounded-xl p-4 hover:border-crf-blue/30 hover:bg-slate-50/30 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-crf-blue-light text-crf-blue flex items-center justify-center font-bold font-mono text-base">T</span>
                    <label className="text-sm font-bold text-slate-800" htmlFor="t_field">
                      Time-bound (Temporal)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Qual o prazo final ou cronograma definido?</span>
                </div>
                <input
                  id="t_field"
                  type="text"
                  value={inputs.t}
                  onChange={(e) => handleInputChange("t", e.target.value)}
                  placeholder="Data limite (ex: até 31 de Outubro, em 6 meses, semanalmente)?"
                  className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:border-crf-blue transition-all"
                />
              </div>
            </div>

            {/* Mensagem de Erro se aplicável */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex gap-2.5 items-start"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block mb-0.5">Pendência Encontrada</span>
                  {error}
                </div>
              </motion.div>
            )}

            {/* Botão de Validação */}
            <div className="pt-2">
              <button
                onClick={handleValidate}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-crf-blue hover:bg-crf-blue-hover disabled:bg-slate-350 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-lg shadow-crf-blue/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 relative overflow-hidden group cursor-pointer"
                id="validator_button"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                
                <span className="relative z-10 select-none">
                  {loading ? "Inteligência analisando cada critério..." : "VALIDAR META INTELIGENTE"}
                </span>
                
                {!loading && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                )}
              </button>
            </div>

          </div>
        </section>

        {/* Divisória ou Loader de Loading detalhado */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden p-8 text-center border border-slate-800 mb-8 print:hidden"
            >
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-crf-red animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Processando com Gemini AI</h3>
              <p className="text-slate-300 max-w-md mx-auto text-sm leading-relaxed">
                Estudando a estrutura de sua meta, calculando o percentual de conformidade SMART, escrevendo feedbacks qualitativos por critério e fundindo as informações para criar a sua meta ideal perfeita...
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-300 font-semibold uppercase tracking-wider bg-slate-950/50 p-2.5 rounded-lg max-w-sm mx-auto">
                <Clock className="w-4 h-4 animate-pulse text-crf-red" />
                Análise de conformidade em andamento
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exibição dos Resultados da Avaliação */}
        <AnimatePresence>
          {result && (
            <motion.div
              id="results_section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 print:space-y-6 print:p-0"
            >
              
              {/* Box Principal de Escoragem e Alinhamento */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-150 overflow-hidden print:shadow-none print:border-none">
                <div className="bg-crf-blue text-white p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 justify-between relative print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300 print:rounded-2xl">
                  
                  {/* Círculo do Score */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative w-32 h-32 flex items-center justify-center bg-crf-blue-hover rounded-full shadow-inner border border-white/10 print:bg-slate-200 print:border-slate-300">
                      {/* SVG Circle Progress */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="rgba(0, 44, 118, 0.4)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke={currentScorePreset.stroke}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="263.8"
                          initial={{ strokeDashoffset: 263.8 }}
                          animate={{ strokeDashoffset: 263.8 - (263.8 * result.adherencePercentage) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-3xl md:text-4xl font-extrabold font-mono tracking-tighter text-white print:text-slate-900">
                          {result.adherencePercentage}%
                        </span>
                        <span className="block text-[9px] text-white/75 uppercase tracking-widest font-black leading-none mt-1 print:text-slate-500">
                          Aderência
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações de feedback geral */}
                  <div className="flex-1 text-center md:text-left space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-widest bg-crf-blue-hover/60 px-2.5 py-1 rounded-md inline-block print:bg-slate-205 print:text-slate-800">
                        Parecer do Mentor de Performance
                      </span>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-extrabold self-center md:self-auto ${currentScorePreset.bg} ${currentScorePreset.text} border ${currentScorePreset.border} print:bg-slate-200 print:text-slate-900 print:border-slate-300`}>
                        Metodologia {result.adherencePercentage >= 80 ? "Sólida" : result.adherencePercentage >= 50 ? "Intermediária" : "Frágil"}
                      </div>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold leading-snug text-slate-105 print:text-slate-900">
                      Como está sua meta atualmente?
                    </h3>
                    
                    <p className="text-sm text-slate-100 leading-relaxed font-medium print:text-slate-700">
                      {result.overallVerdict}
                    </p>
                  </div>

                </div>

                {/* Bloco Refinado: O Antes e Depois */}
                <div className="p-6 md:p-8 bg-slate-50/70 border-t border-slate-100 print:bg-white print:border-t-2 print:border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5 print:text-slate-650">
                    <Sparkles className="w-3.5 h-3.5 text-crf-red animate-pulse print:hidden" />
                    SÍNTESE REFORMULADA (A SUA META SMART IDEAL)
                  </h4>

                  <div className="flex flex-col gap-4">
                    {/* Linha da Versão Anterior (Rascunho) */}
                    <div className="p-4 rounded-xl bg-slate-200/50 border border-slate-200 relative print:bg-slate-105 print:border-slate-300">
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wide print:bg-slate-300 print:text-slate-800">
                        Antes (Rascunho)
                      </span>
                      <p className="text-xs text-slate-600 italic">
                        "{inputs.goal}"
                      </p>
                    </div>

                    {/* Meta Alinhada (Sugerida pela Inteligência) */}
                    <div className="p-5 rounded-xl bg-crf-blue-light/50 text-slate-950 border border-crf-blue/15 relative group/card shadow-xs print:bg-slate-50 print:border-slate-300 print:p-4">
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded bg-crf-blue text-white text-[10px] font-extrabold uppercase tracking-wide shadow-xs print:bg-slate-900 print:text-white">
                        Depois (Meta Alinhada 100% SMART)
                      </span>
                      
                      <p className="text-sm font-semibold leading-relaxed pr-10 text-slate-900 mt-1 print:pr-0">
                        {result.refinedGoal}
                      </p>

                      <button
                        onClick={() => copyToClipboard(result.refinedGoal)}
                        className="absolute right-4 top-4 p-2 rounded-lg bg-crf-blue/10 hover:bg-crf-blue/20 text-crf-blue border border-crf-blue/10 transition-colors cursor-pointer group/btn print:hidden"
                        title="Copiar meta para a área de transferência"
                        id="copy_refined_goal"
                      >
                        {copiedText ? (
                          <CheckCircle className="w-4 h-4 text-crf-blue" />
                        ) : (
                          <Copy className="w-4 h-4 text-crf-blue group-hover/btn:scale-105 transition-transform" />
                        )}
                        <span className="sr-only">Copiar</span>
                      </button>

                      {copiedText && (
                        <div className="absolute right-4 bottom-2 text-[10px] font-bold text-crf-blue animate-fade-in print:hidden">
                          Copiada!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnóstico por Critério (Letra por Letra) */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 print:text-slate-900">
                  <TrendingUp className="w-5 h-5 text-crf-red print:hidden" />
                  Diagnóstico por Critério de Performance
                </h3>

                <div className="space-y-4">
                  {[
                    { key: "S", letter: "S", icon: Target, name: "Específica / Specific", color: "sky", details: result.criteria.S },
                    { key: "M", letter: "M", icon: BarChart3, name: "Mensurável / Measurable", color: "emerald", details: result.criteria.M },
                    { key: "A", letter: "A", icon: Award, name: "Ambiciosa / Ambitious", color: "violet", details: result.criteria.A },
                    { key: "R", letter: "R", icon: Compass, name: "Relevante / Relevant", color: "amber", details: result.criteria.R },
                    { key: "T", letter: "T", icon: Calendar, name: "Temporal / Time-bound", color: "rose", details: result.criteria.T }
                  ].map((crit) => {
                    const iconColorMap: any = {
                      sky: "bg-crf-blue-light text-crf-blue border-crf-blue/15",
                      emerald: "bg-crf-red-light text-crf-red border-crf-red/15",
                      violet: "bg-crf-blue-light text-crf-blue border-crf-blue/15",
                      amber: "bg-crf-red-light text-crf-red border-crf-red/15",
                      rose: "bg-crf-blue-light text-crf-blue border-crf-blue/15"
                    };

                    const badgeColor = getScoreColor(crit.details.score);

                    return (
                      <div 
                        key={crit.key}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border print:border-slate-200"
                      >
                        {/* Header do diagnóstico */}
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 bg-slate-50/20 print:bg-slate-50 print:py-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg ${iconColorMap[crit.color]} border flex items-center justify-center font-black font-mono text-base`}>
                              {crit.letter}
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{crit.name}</h4>
                            </div>
                          </div>
                          
                          {/* Nota por Critério */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">Pontuação do critério:</span>
                            <div className={`px-2.5 py-1 rounded-lg text-xs font-black ${badgeColor.bg} ${badgeColor.text} border ${badgeColor.border} print:bg-slate-100 print:text-slate-800 print:border-slate-300`}>
                              {crit.details.rating} • {crit.details.score}/100
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo do diagnóstico */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 print:p-4 print:grid-cols-2">
                          
                          {/* Análise */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1 print:text-slate-500">
                              <Info className="w-3.5 h-3.5 text-slate-400 print:hidden" />
                              O que diz o avaliador
                            </h5>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                              {crit.details.analysis}
                            </p>
                          </div>

                          {/* Passos de Melhora */}
                          <div className="space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-100 print:bg-white print:border-slate-200">
                            <h5 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1 print:text-slate-500">
                              <Sparkles className="w-3.5 h-3.5 text-crf-red animate-pulse print:hidden" />
                              Sugestão de Ajuste
                            </h5>
                            <p className="text-xs text-slate-700 leading-relaxed italic">
                              {crit.details.suggestions}
                            </p>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dica para persistir e começar */}
              <div className="p-4 rounded-xl bg-slate-100 text-slate-800 border border-slate-205 flex items-start gap-3 print:hidden">
                <div className="p-1 rounded-lg bg-crf-blue text-white shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Quer salvar seu resultado?</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Você pode copiar a sua meta ideal reformulada e utilizá-la em planilhas, sistemas de metas (como OKRs) ou mandá-la para o seu time de trabalho usando a opção de compartilhar o link customizado de preenchimento.
                  </p>
                </div>
              </div>

              {/* Box de Exportação de Relatório (Carrefour DHO) */}
              <div className="bg-slate-105 rounded-2xl p-6 border border-slate-200 w-full flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="space-y-1 text-left">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-crf-red" />
                    Salvar Relatório de Performance - Carrefour DHO
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                    Gere o documento oficial com o diagnóstico metodológico completo e a meta refinada em formato de texto estruturado (.txt) compatível com qualquer dispositivo.
                  </p>
                </div>
                
                <div className="flex w-full md:w-auto shrink-0 justify-end">
                  <button
                    onClick={handleExportTxt}
                    className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-crf-blue text-white text-xs font-bold hover:bg-crf-blue-hover hover:shadow-md active:scale-[0.98] transition-all cursor-pointer text-center w-full md:w-auto"
                    title="Baixar relatório completo formatado em Texto (.txt)"
                    id="export_txt_button"
                  >
                    <FileText className="w-4.5 h-4.5 text-white" />
                    Baixar Relatório (.txt)
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer minimalista sem tech-slop */}
      <footer className="max-w-2xl mx-auto mt-20 text-center px-4 print:hidden">
        <p className="text-xs text-slate-400">
          Metodologia SMART • Desenvolvido com inteligência sob demanda do Gemini AI
        </p>
      </footer>

    </div>
  );
}

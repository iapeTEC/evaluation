// Rubric definitions (1..5) per skill
window.RUBRIC = {
  Listening: [
    "Reconhece apenas palavras isoladas (cores, números, animais) e comandos básicos (\"Sit down\").",
    "Entende frases curtas em contextos previsíveis, mas precisa de repetição lenta.",
    "Compreende a ideia principal de diálogos simples e identifica informações específicas (nomes, idades).",
    "Compreende a maioria do que é dito em velocidade natural sobre temas familiares (escola, família, hobbies).",
    "Compreende 100% de instruções e narrativas simples, captando detalhes sutis e variações de entonação."
  ],
  Speaking: [
    "Responde apenas com \"Yes/No\" ou palavras soltas. Aponta para objetos em vez de nomeá-los.",
    "Responde perguntas básicas com frases prontas (ex: \"I am ten years old\") e descreve objetos de forma isolada.",
    "Consegue descrever uma cena simples (cores, posições) e manter uma conversa básica com pausas para pensar.",
    "Narra uma sequência de fatos (contar uma história a partir de figuras) com poucos erros de pronúncia.",
    "Fala com fluidez e confiança. Expressa opiniões e descreve diferenças entre duas imagens detalhadamente."
  ],
  Reading: [
    "Reconhece o alfabeto e lê palavras isoladas com auxílio visual (leitura global).",
    "Lê frases curtas e associa corretamente a imagens (ex: \"The cat is under the table\").",
    "Compreende textos curtos (e-mails ou bilhetes) e responde perguntas de \"Verdadeiro ou Falso\".",
    "Lê e entende a função gramatical das palavras em um texto e completa lacunas de um texto curto.",
    "Compreende textos narrativos mais longos e infere significados por contexto, sem precisar de tradução."
  ],
  Writing: [
    "Consegue copiar palavras e escrever o próprio nome e idade.",
    "Escreve palavras simples sem erros ortográficos graves e completa frases curtas sobre si mesmo.",
    "Descreve uma imagem com frases completas (Sujeito + Verbo + Predicado).",
    "Escreve pequena mensagem ou história (20–30 palavras) com conectivos simples (and, but, because).",
    "Escreve textos coerentes, com pontuação e gramática (presente contínuo, passado simples), vocabulário variado."
  ]
};

// Cambridge reference by average
window.CAMBRIDGE_REF = (avg) => {
  if (avg < 1.6) return "Pré-Starters";
  if (avg < 2.6) return "Starters";
  if (avg < 3.6) return "Movers";
  if (avg < 4.6) return "Flyers";
  return "Preparado para KET (A2 Key)";
};

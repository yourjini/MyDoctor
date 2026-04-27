// Claude-powered extraction for health checkup PDFs and images.
// Uses Opus 4.7 with adaptive thinking and structured JSON output.

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic();
  }
  return _client;
}

export type ExtractedCheckup = {
  date: string; // YYYY-MM-DD (best guess from document; defaults to today if unknown)
  title: string; // e.g. "2026 종합건강검진"
  hospitalName: string; // best guess
  summary: string; // 2-5 paragraph summary in Korean
  symptoms: string; // notable findings / abnormal values, in Korean
  doctorOpinion: string; // doctor's overall opinion if present
};

const SCHEMA = {
  type: "object",
  properties: {
    date: {
      type: "string",
      description:
        "검진일을 YYYY-MM-DD 형식으로. 문서에서 찾을 수 없으면 빈 문자열.",
    },
    title: {
      type: "string",
      description: "검진의 종류와 연도 (예: '2026 종합건강검진', '위내시경 검사').",
    },
    hospitalName: {
      type: "string",
      description: "병원/검진센터 이름. 알 수 없으면 빈 문자열.",
    },
    summary: {
      type: "string",
      description:
        "검진 결과를 한국어 2-4문단으로 요약. 환자가 나중에 다시 봤을 때 본인 상태를 빠르게 파악할 수 있도록 정상/주의/이상 항목을 명확히 구분.",
    },
    symptoms: {
      type: "string",
      description:
        "주목할 만한 이상 소견이나 비정상 수치를 항목별로 정리 (불릿 또는 줄바꿈). 정상 항목은 제외. 없으면 빈 문자열.",
    },
    doctorOpinion: {
      type: "string",
      description:
        "문서에 의사 종합소견이 있으면 그대로 옮겨 적기. 없으면 빈 문자열.",
    },
  },
  required: ["date", "title", "hospitalName", "summary", "symptoms", "doctorOpinion"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `당신은 한국의 건강검진 결과를 분석해 환자가 쉽게 이해할 수 있도록 요약하는 의료 문서 분석가입니다.

지침:
- 모든 출력은 한국어
- 의학 용어는 그대로 두되, 필요시 짧은 설명을 괄호로 보충
- 추측하지 말 것 — 문서에 없는 정보는 빈 문자열로 두기
- 비정상 수치는 정상 범위와 함께 명시
- 진단을 내리지 말고, 문서에 적힌 내용만 요약`;

export async function extractCheckup(
  files: { contentType: string; data: Buffer; filename: string }[],
): Promise<ExtractedCheckup> {
  if (files.length === 0) throw new Error("No files provided");

  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: "아래 첨부된 건강검진 결과 문서를 분석해 JSON 스키마에 맞춰 요약해주세요.",
    },
  ];

  for (const f of files) {
    if (f.contentType === "application/pdf") {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: f.data.toString("base64"),
        },
      });
    } else if (f.contentType.startsWith("image/")) {
      const mt = f.contentType as "image/png" | "image/jpeg" | "image/gif" | "image/webp";
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mt,
          data: f.data.toString("base64"),
        },
      });
    }
  }

  const response = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output_config: {
      format: {
        type: "json_schema",
        schema: SCHEMA,
      },
    },
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Claude returned no text");
  }
  const parsed = JSON.parse(text.text) as ExtractedCheckup;
  // Default date to today if blank
  if (!parsed.date) parsed.date = new Date().toISOString().slice(0, 10);
  return parsed;
}

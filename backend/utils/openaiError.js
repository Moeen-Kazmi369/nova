const OPENAI_QUOTA_LIMIT_MESSAGE =
  "NOVA cannot respond right now because the OpenAI API quota or billing limit for this workspace has been reached. Please ask an admin to add credits or increase the OpenAI quota, then try again.";

function collectErrorText(error) {
  const parts = [
    error?.message,
    error?.code,
    error?.type,
    error?.status,
    error?.error?.message,
    error?.error?.code,
    error?.error?.type,
    error?.response?.data?.message,
    error?.response?.data?.error?.message,
    error?.response?.data?.error?.code,
    error?.response?.data?.error?.type,
  ];

  return parts
    .filter((part) => part !== undefined && part !== null)
    .map((part) => String(part).toLowerCase())
    .join(" ");
}

function isOpenAIQuotaError(error) {
  const text = collectErrorText(error);

  return (
    text.includes("insufficient_quota") ||
    text.includes("billing_hard_limit_reached") ||
    (text.includes("quota") &&
      (text.includes("exceeded") ||
        text.includes("limit") ||
        text.includes("billing") ||
        text.includes("credit"))) ||
    (Number(error?.status || error?.response?.status) === 429 &&
      text.includes("quota"))
  );
}

module.exports = {
  OPENAI_QUOTA_LIMIT_MESSAGE,
  isOpenAIQuotaError,
};

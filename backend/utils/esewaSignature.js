import crypto from "crypto";

export const generateEsewaSignature = ({
  total_amount,
  transaction_uuid,
  product_code,
}) => {
  const secretKey = process.env.ESEWA_SECRET_KEY;
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
  return hash;
};

import { S3Client } from "@aws-sdk/client-s3";

export type S3Config = {
  client: S3Client;
  bucket: string;
  publicUrlBase: string;
};

export function getS3Config(): S3Config {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicUrlBase = process.env.S3_PUBLIC_URL_BASE;

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey || !publicUrlBase) {
    throw new Error("S3-хранилище не настроено: проверьте переменные S3_* в окружении");
  }

  return {
    client: new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
    publicUrlBase: publicUrlBase.replace(/\/$/, ""),
  };
}

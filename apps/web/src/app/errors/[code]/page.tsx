import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lost } from "@/components/lost/Lost";
import { ERRORS, type ErrorCode } from "@/lib/errors";
import { SITE_NAME } from "@/lib/meta";

interface Props {
  params: Promise<{ code: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ERRORS).map((code) => ({ code }));
}

function isCode(code: string): code is ErrorCode {
  return code in ERRORS;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: { absolute: `${code} | ${SITE_NAME}` },
    robots: { index: false },
  };
}

export default async function ErrorPage({ params }: Props) {
  const { code } = await params;
  if (!isCode(code)) notFound();
  const { message, cat } = ERRORS[code];
  return <Lost code={code} message={message} cat={cat} />;
}

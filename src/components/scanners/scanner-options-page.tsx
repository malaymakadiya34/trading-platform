import { notFound } from "next/navigation";
import {
  OptionContractTable,
  ScannerHeader,
  ScannerUnavailable,
} from "@/src/components/scanners/intraday-scanner-workspace";
import { getScannerOptions } from "@/src/server/scanners/intraday-scanner-repository";

export async function ScannerOptionsPage({
  symbol,
  direction,
  returnHref,
}: {
  symbol: string;
  direction: "UP" | "DOWN";
  returnHref: string;
}) {
  let data;
  try {
    data = await getScannerOptions(symbol, direction);
  } catch {
    return (
      <>
        <ScannerHeader
          title="Option Details"
          description="Actual nearest-expiry contract metadata for the selected scanner candidate."
        />
        <ScannerUnavailable error />
      </>
    );
  }
  if (!data) notFound();
  return (
    <>
      <ScannerHeader
        title="Option Details"
        description="ATM, ITM1 and ITM2 are selected from actual available CE/PE contract strikes."
      />
      <OptionContractTable data={data} returnHref={returnHref} />
    </>
  );
}

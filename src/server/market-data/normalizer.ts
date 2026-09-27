import type {
  ContractDescriptor,
  InstrumentDescriptor,
  Quote,
} from "@/src/domain/market-data/types";

export function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeInstrument(input: InstrumentDescriptor): InstrumentDescriptor {
  return {
    ...input,
    symbol: input.symbol.trim(),
    normalizedSymbol: normalizeSymbol(input.normalizedSymbol || input.symbol),
    displayName: input.displayName.trim(),
    exchange: input.exchange.trim().toUpperCase(),
    currency: input.currency.trim().toUpperCase(),
  };
}

export function normalizeContract(input: ContractDescriptor): ContractDescriptor {
  return {
    ...input,
    contractSymbol: input.contractSymbol.trim(),
    normalizedSymbol: normalizeSymbol(input.normalizedSymbol || input.contractSymbol),
    exchange: input.exchange.trim().toUpperCase(),
    underlyingSymbol: input.underlyingSymbol.trim(),
  };
}

export function normalizeQuote(input: Quote): Quote {
  return {
    ...input,
    symbol: input.symbol.trim(),
    exchange: input.exchange.trim().toUpperCase(),
    source: input.source.trim(),
  };
}

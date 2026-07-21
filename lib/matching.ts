export type Demand = {
  id: string;
  name: string;
  operation?: string;
  propertyType?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  areaMin?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  paymentMode?: string;
};

export type Property = {
  id: string;
  code: string;
  name: string;
  operation?: string;
  propertyType?: string;
  location?: string;
  price?: number;
  area?: number;
  commercialStatus?: string;
  availability?: string;
};

export type MatchLevel = "Fuerte" | "Posible" | "Débil";

export type MatchResult = {
  demandId: string;
  propertyId: string;
  name: string;
  score: number;
  level: MatchLevel;
  reasons: string[];
  alerts: string[];
  humanReviewRequired: boolean;
};

const normalize = (value?: string) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim() ?? "";

const tokenOverlap = (left?: string, right?: string) => {
  const a = new Set(normalize(left).split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const b = new Set(normalize(right).split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  if (!a.size || !b.size) return 0;
  const matches = [...a].filter((token) => b.has(token)).length;
  return matches / Math.min(a.size, b.size);
};

const compatibleType = (demandType?: string, propertyType?: string) => {
  const demand = normalize(demandType);
  const property = normalize(propertyType);
  if (!demand || !property) return undefined;
  if (demand === property) return true;
  if (demand === "lote" && property === "terreno") return true;
  if (demand === "terreno" && property === "lote") return true;
  return false;
};

const compatibleOperation = (demandOperation?: string, propertyOperation?: string) => {
  const demand = normalize(demandOperation);
  const property = normalize(propertyOperation);
  if (!demand || !property) return undefined;
  if (demand === property) return true;
  if (demand === "compra" && property === "venta") return true;
  return false;
};

export function scoreMatch(demand: Demand, property: Property): MatchResult | null {
  if (normalize(property.commercialStatus) === "archivada") return null;

  let score = 0;
  let availableWeight = 0;
  const reasons: string[] = [];
  const alerts: string[] = [];

  const operation = compatibleOperation(demand.operation, property.operation);
  if (operation !== undefined) {
    availableWeight += 20;
    if (operation) {
      score += 20;
      reasons.push("La operación solicitada coincide con la propiedad.");
    } else {
      alerts.push("La operación no coincide.");
    }
  } else {
    alerts.push("Falta confirmar la operación en la demanda o la propiedad.");
  }

  const type = compatibleType(demand.propertyType, property.propertyType);
  if (type !== undefined) {
    availableWeight += 30;
    if (type) {
      score += 30;
      reasons.push("El tipo de inmueble coincide.");
    } else {
      alerts.push("El tipo de inmueble no coincide.");
    }
  } else {
    alerts.push("Falta definir el tipo de inmueble.");
  }

  if (demand.budgetMax !== undefined && property.price !== undefined) {
    availableWeight += 30;
    if (property.price <= demand.budgetMax) {
      score += 30;
      reasons.push("El precio está dentro del presupuesto máximo.");
    } else {
      const excess = (property.price - demand.budgetMax) / demand.budgetMax;
      if (excess <= 0.1) {
        score += 15;
        alerts.push(`El precio supera el presupuesto en ${Math.round(excess * 100)}%; revisar negociación.`);
      } else {
        alerts.push("El precio supera claramente el presupuesto máximo.");
      }
    }
    if (demand.budgetMin !== undefined && property.price < demand.budgetMin) {
      alerts.push("El precio está por debajo del rango mínimo; confirmar expectativas del cliente.");
    }
  } else {
    alerts.push("Falta precio de la propiedad o presupuesto máximo del cliente.");
  }

  if (demand.location && property.location) {
    availableWeight += 15;
    const overlap = tokenOverlap(demand.location, property.location);
    if (overlap >= 0.5) {
      score += 15;
      reasons.push("La ubicación coincide con la zona solicitada.");
    } else if (overlap > 0) {
      score += 7;
      alerts.push("La ubicación coincide parcialmente.");
    } else {
      alerts.push("La ubicación no coincide con la zona solicitada.");
    }
  } else {
    alerts.push("Falta ubicación estructurada en la demanda o la propiedad.");
  }

  if (demand.areaMin !== undefined && property.area !== undefined) {
    availableWeight += 5;
    if (property.area >= demand.areaMin) {
      score += 5;
      reasons.push("El área cumple el mínimo requerido.");
    } else {
      alerts.push("El área es menor que el mínimo solicitado.");
    }
  }

  if (availableWeight === 0) return null;

  const normalizedScore = Math.round((score / availableWeight) * 100);
  if (normalizedScore < 40) return null;

  const level: MatchLevel = normalizedScore >= 80 ? "Fuerte" : normalizedScore >= 55 ? "Posible" : "Débil";

  return {
    demandId: demand.id,
    propertyId: property.id,
    name: `${demand.name} ↔ ${property.code || property.name}`,
    score: normalizedScore,
    level,
    reasons,
    alerts,
    humanReviewRequired: alerts.length > 0,
  };
}

export function calculateMatches(demands: Demand[], properties: Property[], limitPerDemand = 5) {
  return demands.flatMap((demand) =>
    properties
      .map((property) => scoreMatch(demand, property))
      .filter((match): match is MatchResult => Boolean(match))
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerDemand),
  );
}

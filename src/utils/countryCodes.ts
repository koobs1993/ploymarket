const COUNTRY_CODES: Record<string, string> = {
  France: "FRA",
  Argentina: "ARG",
  Spain: "ESP",
  England: "ENG",
  Portugal: "POR",
  Brazil: "BRA",
  Netherlands: "NED",
  Germany: "GER",
  USA: "USA",
  Norway: "NOR",
  Japan: "JPN",
  Morocco: "MAR",
  Colombia: "COL",
  Belgium: "BEL",
  Italy: "ITA",
  Croatia: "CRO",
  Uruguay: "URU",
  Mexico: "MEX",
  Switzerland: "SUI",
  Canada: "CAN",
  Ecuador: "ECU",
  Senegal: "SEN",
  Austria: "AUT",
  Sweden: "SWE",
  "South Korea": "KOR",
  Denmark: "DEN",
  Poland: "POL",
  Serbia: "SRB",
  Ukraine: "UKR",
  Scotland: "SCO",
  Wales: "WAL",
  Iran: "IRN",
  Australia: "AUS",
  Ghana: "GHA",
  Cameroon: "CMR",
  Tunisia: "TUN",
  Algeria: "ALG",
  Egypt: "EGY",
  "Ivory Coast": "CIV",
  "Cape Verde": "CPV",
  Paraguay: "PAR",
  Chile: "CHI",
  Peru: "PER",
  Qatar: "QAT",
  "Saudi Arabia": "KSA",
  Haiti: "HAI",
  Panama: "PAN",
  Jordan: "JOR",
  Uzbekistan: "UZB",
  "New Zealand": "NZL",
  "Costa Rica": "CRC",
  Curacao: "CUW",
  Other: "OTH",
};

const COUNTRY_COLORS: Record<string, string> = {
  France: "#0055A4",
  Argentina: "#74ACDF",
  Spain: "#C60B1E",
  England: "#CF081F",
  Portugal: "#006847",
  Brazil: "#009C3B",
  Netherlands: "#FF6B00",
  Germany: "#DD0000",
  USA: "#3C3B6E",
  Norway: "#BA0C2F",
  Japan: "#BC002D",
  Morocco: "#C1272D",
  Colombia: "#FCD116",
  Belgium: "#FFD700",
  Italy: "#009246",
  Croatia: "#FF0000",
  Uruguay: "#0038A8",
  Mexico: "#006847",
  Switzerland: "#FF0000",
  Canada: "#FF0000",
  Ecuador: "#FFD100",
  Senegal: "#00853F",
  Austria: "#ED2939",
  Sweden: "#006AA7",
  "South Korea": "#CD2E3A",
  Denmark: "#C8102E",
  Poland: "#DC143C",
  Serbia: "#C6363C",
  Ukraine: "#005BBB",
  Scotland: "#0065BD",
  Wales: "#D30731",
  Iran: "#239F40",
  Australia: "#00843D",
  Ghana: "#006B3F",
  Cameroon: "#007A5E",
  Tunisia: "#E70013",
  Algeria: "#006233",
  Egypt: "#CE1126",
  "Ivory Coast": "#F77F00",
  "Cape Verde": "#003893",
  Paraguay: "#D52B1E",
  Chile: "#D52B1E",
  Peru: "#D91023",
  Qatar: "#8A1538",
  "Saudi Arabia": "#006C35",
  Haiti: "#00209F",
  Panama: "#005293",
  Jordan: "#007A3D",
  Uzbekistan: "#1EB53A",
  "New Zealand": "#00247D",
  "Costa Rica": "#002B7F",
  Curacao: "#002B7F",
};

const FALLBACK_COLORS = ["#ffc145", "#74ACDF", "#C60B1E", "#009C3B", "#FF6B00"] as const;

export function getCountryCode(name: string): string {
  if (COUNTRY_CODES[name]) return COUNTRY_CODES[name];

  const initials = name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || name.slice(0, 3).toUpperCase();
}

export function getCountryColor(name: string, fallbackIndex = 0): string {
  if (COUNTRY_COLORS[name]) return COUNTRY_COLORS[name];
  return FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
}

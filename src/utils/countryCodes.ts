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

// Indian states and major cities data
export interface LocationData {
  country: string;
  state: string;
  city: string;
}

export interface State {
  name: string;
  code: string;
  cities: string[];
}

export const INDIAN_STATES: State[] = [
  {
    name: "Andhra Pradesh",
    code: "AP",
    cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kadapa", "Anantapur", "Eluru"]
  },
  {
    name: "Arunachal Pradesh",
    code: "AR",
    cities: ["Itanagar", "Naharlagun", "Pasighat", "Tezpur", "Bomdila", "Ziro", "Along", "Tezu", "Changlang", "Khonsa"]
  },
  {
    name: "Assam",
    code: "AS",
    cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "North Lakhimpur"]
  },
  {
    name: "Bihar",
    code: "BR",
    cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar"]
  },
  {
    name: "Chhattisgarh",
    code: "CG",
    cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Mahasamund"]
  },
  {
    name: "Goa",
    code: "GA",
    cities: ["Panaji", "Vasco da Gama", "Margao", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem"]
  },
  {
    name: "Gujarat",
    code: "GJ",
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Morbi"]
  },
  {
    name: "Haryana",
    code: "HR",
    cities: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"]
  },
  {
    name: "Himachal Pradesh",
    code: "HP",
    cities: ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta Sahib", "Sundernagar", "Chamba"]
  },
  {
    name: "Jharkhand",
    code: "JH",
    cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar"]
  },
  {
    name: "Karnataka",
    code: "KA",
    cities: ["Bengaluru", "Mysuru", "Hubli-Dharwad", "Mangaluru", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga"]
  },
  {
    name: "Kerala",
    code: "KL",
    cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Alappuzha", "Palakkad", "Kannur", "Kasaragod", "Kottayam"]
  },
  {
    name: "Madhya Pradesh",
    code: "MP",
    cities: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"]
  },
  {
    name: "Maharashtra",
    code: "MH",
    cities: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli"]
  },
  {
    name: "Manipur",
    code: "MN",
    cities: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati", "Tamenglong", "Jiribam", "Moreh"]
  },
  {
    name: "Meghalaya",
    code: "ML",
    cities: ["Shillong", "Tura", "Nongstoin", "Jowai", "Baghmara", "Williamnagar", "Nongpoh", "Mawkyrwat", "Resubelpara", "Ampati"]
  },
  {
    name: "Mizoram",
    code: "MZ",
    cities: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Bairabi", "Vairengte"]
  },
  {
    name: "Nagaland",
    code: "NL",
    cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Kiphire", "Longleng", "Peren"]
  },
  {
    name: "Odisha",
    code: "OR",
    cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"]
  },
  {
    name: "Punjab",
    code: "PB",
    cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Batala", "Pathankot", "Moga"]
  },
  {
    name: "Rajasthan",
    code: "RJ",
    cities: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"]
  },
  {
    name: "Sikkim",
    code: "SK",
    cities: ["Gangtok", "Namchi", "Geyzing", "Mangan", "Jorethang", "Nayabazar", "Rangpo", "Singtam", "Pakyong", "Ravangla"]
  },
  {
    name: "Tamil Nadu",
    code: "TN",
    cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi"]
  },
  {
    name: "Telangana",
    code: "TS",
    cities: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"]
  },
  {
    name: "Tripura",
    code: "TR",
    cities: ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia", "Khowai", "Pratapgarh", "Ranirbazar", "Sonamura", "Kumarghat"]
  },
  {
    name: "Uttar Pradesh",
    code: "UP",
    cities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad"]
  },
  {
    name: "Uttarakhand",
    code: "UK",
    cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwar", "Ramnagar", "Manglaur"]
  },
  {
    name: "West Bengal",
    code: "WB",
    cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman", "Barasat", "Raiganj", "Kharagpur"]
  },
  {
    name: "Delhi",
    code: "DL",
    cities: ["New Delhi", "Delhi Cantonment", "Karol Bagh", "Lajpat Nagar", "Connaught Place", "Dwarka", "Rohini", "Janakpuri", "Saket", "Vasant Kunj"]
  },
  {
    name: "Jammu and Kashmir",
    code: "JK",
    cities: ["Srinagar", "Jammu", "Baramulla", "Anantnag", "Sopore", "Kathua", "Udhampur", "Punch", "Rajouri", "Kupwara"]
  },
  {
    name: "Ladakh",
    code: "LA",
    cities: ["Leh", "Kargil", "Nubra", "Zanskar", "Drass", "Nyoma", "Khalsi", "Sankoo", "Padum", "Diskit"]
  },
  {
    name: "Andaman and Nicobar Islands",
    code: "AN",
    cities: ["Port Blair", "Bamboo Flat", "Garacharma", "Diglipur", "Baratang", "Rangat", "Mayabunder", "Campbell Bay", "Car Nicobar", "Hut Bay"]
  },
  {
    name: "Chandigarh",
    code: "CH",
    cities: ["Chandigarh", "Sector 17", "Sector 22", "Sector 35", "Manimajra", "Panchkula", "Mohali"]
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DN",
    cities: ["Daman", "Diu", "Silvassa", "Naroli", "Dadra", "Khanvel", "Samarvarni", "Dudhani", "Khadoli", "Rakholi"]
  },
  {
    name: "Lakshadweep",
    code: "LD",
    cities: ["Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott", "Kalpeni", "Kadmat", "Kiltan", "Chetlat", "Bitra"]
  },
  {
    name: "Puducherry",
    code: "PY",
    cities: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Villianur", "Ariyankuppam", "Bahour", "Nettapakkam", "Mannadipet", "Ozhukarai"]
  }
];

export const getStateByName = (stateName: string): State | undefined => {
  return INDIAN_STATES.find(state => state.name.toLowerCase() === stateName.toLowerCase());
};

export const getCitiesByState = (stateName: string): string[] => {
  const state = getStateByName(stateName);
  return state ? state.cities : [];
};

export const searchCities = (query: string, stateName?: string): string[] => {
  const searchTerm = query.toLowerCase();
  
  if (stateName) {
    const cities = getCitiesByState(stateName);
    return cities.filter(city => city.toLowerCase().includes(searchTerm));
  }
  
  // Search across all cities
  const allCities: string[] = [];
  INDIAN_STATES.forEach(state => {
    allCities.push(...state.cities);
  });
  
  return allCities.filter(city => city.toLowerCase().includes(searchTerm));
};

export const formatLocation = (location: LocationData): string => {
  const parts = [location.city, location.state, location.country].filter(Boolean);
  return parts.join(', ');
};

export const parseLocationString = (locationString: string): Partial<LocationData> => {
  const parts = locationString.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    return {
      city: parts[0],
      state: parts[1],
      country: parts[2]
    };
  } else if (parts.length === 2) {
    return {
      city: parts[0],
      state: parts[1],
      country: 'India'
    };
  } else if (parts.length === 1) {
    return {
      city: parts[0],
      country: 'India'
    };
  }
  
  return {};
};


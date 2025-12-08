import api from './api';

// Comprehensive static states data for all major countries
// This ensures states are always available even if APIs fail
const getStaticStates = (countryCode) => {
  const staticData = {
    'IN': [ // India
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
      'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
    ],
    'US': [ // United States
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
      'Wisconsin', 'Wyoming', 'District of Columbia'
    ],
    'CA': [ // Canada
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
      'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
      'Quebec', 'Saskatchewan', 'Yukon'
    ],
    'AU': [ // Australia
      'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
      'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
    ],
    'GB': [ // United Kingdom
      'England', 'Scotland', 'Wales', 'Northern Ireland'
    ],
    'BR': [ // Brazil
      'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
      'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
      'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
      'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina',
      'São Paulo', 'Sergipe', 'Tocantins'
    ],
    'MX': [ // Mexico
      'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
      'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
      'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
      'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
      'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
    ],
    'DE': [ // Germany
      'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
      'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia',
      'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein',
      'Thuringia'
    ],
    'FR': [ // France
      'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire',
      'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine',
      'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
    ],
    'IT': [ // Italy
      'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia',
      'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise', 'Piedmont', 'Puglia', 'Sardinia',
      'Sicily', 'Trentino-Alto Adige', 'Tuscany', 'Umbria', 'Valle d\'Aosta', 'Veneto'
    ],
    'ES': [ // Spain
      'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands',
      'Cantabria', 'Castile and León', 'Castile-La Mancha', 'Catalonia', 'Extremadura', 'Galicia',
      'La Rioja', 'Madrid', 'Murcia', 'Navarre', 'Valencia'
    ],
    'CN': [ // China
      'Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou',
      'Hainan', 'Hebei', 'Heilongjiang', 'Henan', 'Hong Kong', 'Hubei', 'Hunan', 'Inner Mongolia',
      'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning', 'Macau', 'Ningxia', 'Qinghai', 'Shaanxi',
      'Shandong', 'Shanghai', 'Shanxi', 'Sichuan', 'Tianjin', 'Tibet', 'Xinjiang', 'Yunnan', 'Zhejiang'
    ],
    'JP': [ // Japan
      'Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka', 'Fukushima', 'Gifu',
      'Gunma', 'Hiroshima', 'Hokkaido', 'Hyogo', 'Ibaraki', 'Ishikawa', 'Iwate', 'Kagawa',
      'Kagoshima', 'Kanagawa', 'Kochi', 'Kumamoto', 'Kyoto', 'Mie', 'Miyagi', 'Miyazaki',
      'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Oita', 'Okayama', 'Okinawa', 'Osaka',
      'Saga', 'Saitama', 'Shiga', 'Shimane', 'Shizuoka', 'Tochigi', 'Tokushima', 'Tokyo',
      'Tottori', 'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'
    ],
    'ZA': [ // South Africa
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga',
      'Northern Cape', 'North West', 'Western Cape'
    ],
    'NG': [ // Nigeria
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
      'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
      'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
      'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
    ],
    'PK': [ // Pakistan
      'Azad Kashmir', 'Balochistan', 'Gilgit-Baltistan', 'Islamabad Capital Territory',
      'Khyber Pakhtunkhwa', 'Punjab', 'Sindh'
    ],
    'BD': [ // Bangladesh
      'Barisal', 'Chittagong', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'
    ],
    'PH': [ // Philippines
      'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique', 'Apayao',
      'Aurora', 'Basilan', 'Bataan', 'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol',
      'Bukidnon', 'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur', 'Camiguin',
      'Capiz', 'Catanduanes', 'Cavite', 'Cebu', 'Compostela Valley', 'Cotabato', 'Davao del Norte',
      'Davao del Sur', 'Davao Occidental', 'Davao Oriental', 'Dinagat Islands', 'Eastern Samar',
      'Guimaras', 'Ifugao', 'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga',
      'La Union', 'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'Leyte', 'Maguindanao',
      'Marinduque', 'Masbate', 'Metro Manila', 'Misamis Occidental', 'Misamis Oriental',
      'Mountain Province', 'Negros Occidental', 'Negros Oriental', 'Northern Samar', 'Nueva Ecija',
      'Nueva Vizcaya', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Pampanga',
      'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 'Romblon', 'Samar', 'Sarangani', 'Siquijor',
      'Sorsogon', 'South Cotabato', 'Southern Leyte', 'Sultan Kudarat', 'Sulu', 'Surigao del Norte',
      'Surigao del Sur', 'Tarlac', 'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur',
      'Zamboanga Sibugay'
    ],
    // Additional countries with comprehensive state data
    'ID': ['Aceh', 'Bali', 'Bangka Belitung', 'Banten', 'Bengkulu', 'Central Java', 'Central Kalimantan', 'Central Sulawesi', 'East Java', 'East Kalimantan', 'East Nusa Tenggara', 'Gorontalo', 'Jakarta', 'Jambi', 'Lampung', 'Maluku', 'North Kalimantan', 'North Maluku', 'North Sulawesi', 'North Sumatra', 'Papua', 'Riau', 'Riau Islands', 'South Kalimantan', 'South Sulawesi', 'South Sumatra', 'Southeast Sulawesi', 'West Java', 'West Kalimantan', 'West Nusa Tenggara', 'West Papua', 'West Sulawesi', 'West Sumatra', 'Yogyakarta'],
    'TH': ['Amnat Charoen', 'Ang Thong', 'Bangkok', 'Bueng Kan', 'Buriram', 'Chachoengsao', 'Chai Nat', 'Chaiyaphum', 'Chanthaburi', 'Chiang Mai', 'Chiang Rai', 'Chonburi', 'Chumphon', 'Kalasin', 'Kamphaeng Phet', 'Kanchanaburi', 'Khon Kaen', 'Krabi', 'Lampang', 'Lamphun', 'Loei', 'Lopburi', 'Mae Hong Son', 'Maha Sarakham', 'Mukdahan', 'Nakhon Nayok', 'Nakhon Pathom', 'Nakhon Phanom', 'Nakhon Ratchasima', 'Nakhon Sawan', 'Nakhon Si Thammarat', 'Nan', 'Narathiwat', 'Nong Bua Lamphu', 'Nong Khai', 'Nonthaburi', 'Pathum Thani', 'Pattani', 'Phang Nga', 'Phatthalung', 'Phayao', 'Phetchabun', 'Phetchaburi', 'Phichit', 'Phitsanulok', 'Phra Nakhon Si Ayutthaya', 'Phrae', 'Phuket', 'Prachin Buri', 'Prachuap Khiri Khan', 'Ranong', 'Ratchaburi', 'Rayong', 'Roi Et', 'Sa Kaeo', 'Sakon Nakhon', 'Samut Prakan', 'Samut Sakhon', 'Samut Songkhram', 'Saraburi', 'Satun', 'Sing Buri', 'Sisaket', 'Songkhla', 'Sukhothai', 'Suphan Buri', 'Surat Thani', 'Surin', 'Tak', 'Trang', 'Trat', 'Ubon Ratchathani', 'Udon Thani', 'Uthai Thani', 'Uttaradit', 'Yala', 'Yasothon'],
    'VN': ['An Giang', 'Bà Rịa-Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên-Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái', 'Can Tho', 'Da Nang', 'Hanoi', 'Ho Chi Minh City'],
    'MY': ['Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'],
    'SG': ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'],
    'KR': ['Busan', 'Chungcheongbuk-do', 'Chungcheongnam-do', 'Daegu', 'Daejeon', 'Gangwon-do', 'Gwangju', 'Gyeonggi-do', 'Gyeongsangbuk-do', 'Gyeongsangnam-do', 'Incheon', 'Jeju-do', 'Jeollabuk-do', 'Jeollanam-do', 'Seoul', 'Sejong', 'Ulsan'],
    'TR': ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'],
    'AR': ['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'],
    'CL': ['Aisén', 'Antofagasta', 'Araucanía', 'Arica y Parinacota', 'Atacama', 'Bío Bío', 'Coquimbo', 'Los Lagos', 'Los Ríos', 'Magallanes', 'Maule', 'Ñuble', 'O\'Higgins', 'Santiago', 'Tarapacá', 'Valparaíso'],
    'CO': ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'],
    'PE': ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'],
    'VE': ['Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'],
    'KE': ['Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'],
    'GH': ['Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'North East', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'],
    'ET': ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Somali', 'Southern Nations, Nationalities, and Peoples\' Region', 'Tigray'],
    'TZ': ['Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Mjini Magharibi', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga', 'Unguja North', 'Unguja South', 'Zanzibar North', 'Zanzibar South', 'Zanzibar West'],
    'RW': ['Eastern Province', 'Kigali', 'Northern Province', 'Southern Province', 'Western Province'],
    'MA': ['Beni Mellal-Khenifra', 'Casablanca-Settat', 'Dakhla-Oued Ed-Dahab', 'Drâa-Tafilalet', 'Fès-Meknès', 'Guelmim-Oued Noun', 'Laâyoune-Sakia El Hamra', 'Marrakech-Safi', 'Oriental', 'Rabat-Salé-Kénitra', 'Souss-Massa', 'Tanger-Tétouan-Al Hoceïma'],
    'DZ': ['Adrar', 'Aïn Defla', 'Aïn Témouchent', 'Algiers', 'Annaba', 'Batna', 'Béchar', 'Béjaïa', 'Biskra', 'Blida', 'Bordj Bou Arréridj', 'Bouïra', 'Boumerdès', 'Chlef', 'Constantine', 'Djelfa', 'El Bayadh', 'El Oued', 'El Tarf', 'Ghardaïa', 'Guelma', 'Illizi', 'Jijel', 'Khenchela', 'Laghouat', 'Mascara', 'Médéa', 'Mila', 'Mostaganem', 'Msila', 'Naâma', 'Oran', 'Ouargla', 'Oum el Bouaghi', 'Relizane', 'Saïda', 'Sétif', 'Sidi Bel Abbès', 'Skikda', 'Souk Ahras', 'Tamanghasset', 'Tébessa', 'Tiaret', 'Tindouf', 'Tipaza', 'Tissemsilt', 'Tizi Ouzou', 'Tlemcen'],
    'TN': ['Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'],
    'IR': ['Alborz', 'Ardabil', 'Bushehr', 'Chaharmahal and Bakhtiari', 'East Azerbaijan', 'Fars', 'Gilan', 'Golestan', 'Hamadan', 'Hormozgan', 'Ilam', 'Isfahan', 'Kerman', 'Kermanshah', 'Khuzestan', 'Kohgiluyeh and Boyer-Ahmad', 'Kurdistan', 'Lorestan', 'Markazi', 'Mazandaran', 'North Khorasan', 'Qazvin', 'Qom', 'Razavi Khorasan', 'Semnan', 'Sistan and Baluchestan', 'South Khorasan', 'Tehran', 'West Azerbaijan', 'Yazd', 'Zanjan'],
    'IQ': ['Al Anbar', 'Al Basrah', 'Al Muthanna', 'Al Qadisiyah', 'An Najaf', 'Arbil', 'As Sulaymaniyah', 'Babil', 'Baghdad', 'Dahuk', 'Dhi Qar', 'Diyala', 'Karbala', 'Kirkuk', 'Maysan', 'Ninawa', 'Salah ad Din', 'Wasit'],
    'IL': ['Central', 'Haifa', 'Jerusalem', 'Northern', 'Southern', 'Tel Aviv'],
    'JO': ['Ajloun', 'Amman', 'Aqaba', 'Balqa', 'Irbid', 'Jerash', 'Karak', 'Ma\'an', 'Madaba', 'Mafraq', 'Tafilah', 'Zarqa'],
    'LB': ['Akkar', 'Baalbek-Hermel', 'Beirut', 'Beqaa', 'Mount Lebanon', 'Nabatieh', 'North', 'South'],
    'SY': ['Al Hasakah', 'Al Ladhiqiyah', 'Al Qunaytirah', 'Ar Raqqah', 'As Suwayda', 'Dar\'a', 'Dayr az Zawr', 'Dimashq', 'Halab', 'Hamah', 'Hims', 'Idlib', 'Rif Dimashq', 'Tartus'],
    'YE': ['Abyan', 'Aden', 'Al Bayda', 'Al Hudaydah', 'Al Jawf', 'Al Mahrah', 'Al Mahwit', 'Amanat Al Asimah', 'Amran', 'Dhamar', 'Hadhramaut', 'Hajjah', 'Ibb', 'Lahij', 'Marib', 'Raymah', 'Saada', 'Sana\'a', 'Shabwah', 'Socotra', 'Ta\'izz'],
    'AF': ['Badakhshan', 'Badghis', 'Baghlan', 'Balkh', 'Bamyan', 'Daykundi', 'Farah', 'Faryab', 'Ghazni', 'Ghor', 'Helmand', 'Herat', 'Jowzjan', 'Kabul', 'Kandahar', 'Kapisa', 'Khost', 'Kunar', 'Kunduz', 'Laghman', 'Logar', 'Nangarhar', 'Nimruz', 'Nuristan', 'Paktia', 'Paktika', 'Panjshir', 'Parwan', 'Samangan', 'Sar-e Pol', 'Takhar', 'Uruzgan', 'Wardak', 'Zabul'],
    'KZ': ['Akmola', 'Aktobe', 'Almaty', 'Atyrau', 'East Kazakhstan', 'Jambyl', 'Karaganda', 'Kostanay', 'Kyzylorda', 'Mangystau', 'North Kazakhstan', 'Pavlodar', 'Turkestan', 'West Kazakhstan'],
    'UZ': ['Andijan', 'Bukhara', 'Fergana', 'Jizzakh', 'Karakalpakstan', 'Kashkadarya', 'Khorezm', 'Namangan', 'Navoiy', 'Samarkand', 'Sirdaryo', 'Surkhandarya', 'Tashkent', 'Tashkent City'],
    'BY': ['Brest', 'Gomel', 'Grodno', 'Minsk', 'Minsk City', 'Mogilev', 'Vitebsk'],
    'UA': ['Cherkasy', 'Chernihiv', 'Chernivtsi', 'Crimea', 'Dnipropetrovsk', 'Donetsk', 'Ivano-Frankivsk', 'Kharkiv', 'Kherson', 'Khmelnytskyi', 'Kiev', 'Kirovohrad', 'Luhansk', 'Lviv', 'Mykolaiv', 'Odessa', 'Poltava', 'Rivne', 'Sumy', 'Ternopil', 'Vinnytsia', 'Volyn', 'Zakarpattia', 'Zaporizhzhia', 'Zhytomyr'],
    'PL': ['Greater Poland', 'Kuyavian-Pomeranian', 'Lesser Poland', 'Łódź', 'Lower Silesian', 'Lublin', 'Lubusz', 'Masovian', 'Opole', 'Podlaskie', 'Pomeranian', 'Silesian', 'Świętokrzyskie', 'Warmian-Masurian', 'West Pomeranian'],
    'RO': ['Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov', 'Brăila', 'Bucharest', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vâlcea', 'Vaslui', 'Vrancea'],
    'GR': ['Attica', 'Central Greece', 'Central Macedonia', 'Crete', 'East Macedonia and Thrace', 'Epirus', 'Ionian Islands', 'North Aegean', 'Peloponnese', 'South Aegean', 'Thessaly', 'West Greece', 'West Macedonia'],
    'PT': ['Aveiro', 'Azores', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisbon', 'Madeira', 'Portalegre', 'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu'],
    'NL': ['Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg', 'North Brabant', 'North Holland', 'Overijssel', 'South Holland', 'Utrecht', 'Zeeland'],
    'BE': ['Antwerp', 'Brussels-Capital Region', 'East Flanders', 'Flemish Brabant', 'Hainaut', 'Liège', 'Limburg', 'Luxembourg', 'Namur', 'Walloon Brabant', 'West Flanders'],
    'CH': ['Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft', 'Basel-Stadt', 'Bern', 'Fribourg', 'Geneva', 'Glarus', 'Grisons', 'Jura', 'Lucerne', 'Neuchâtel', 'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz', 'Solothurn', 'St. Gallen', 'Thurgau', 'Ticino', 'Uri', 'Valais', 'Vaud', 'Zug', 'Zürich'],
    'AT': ['Burgenland', 'Carinthia', 'Lower Austria', 'Salzburg', 'Styria', 'Tyrol', 'Upper Austria', 'Vienna', 'Vorarlberg'],
    'SE': ['Blekinge', 'Dalarna', 'Gävleborg', 'Gotland', 'Halland', 'Jämtland', 'Jönköping', 'Kalmar', 'Kronoberg', 'Norrbotten', 'Örebro', 'Östergötland', 'Skåne', 'Stockholm', 'Södermanland', 'Uppsala', 'Värmland', 'Västerbotten', 'Västernorrland', 'Västmanland', 'Västra Götaland'],
    'NO': ['Agder', 'Innlandet', 'Møre og Romsdal', 'Nordland', 'Oslo', 'Rogaland', 'Troms og Finnmark', 'Trøndelag', 'Vestfold og Telemark', 'Vestland', 'Viken'],
    'DK': ['Capital Region of Denmark', 'Central Denmark Region', 'North Denmark Region', 'Region of Southern Denmark', 'Region Zealand'],
    'FI': ['Åland', 'Central Finland', 'Central Ostrobothnia', 'Kainuu', 'Kymenlaakso', 'Lapland', 'North Karelia', 'Northern Ostrobothnia', 'Northern Savonia', 'Ostrobothnia', 'Päijät-Häme', 'Pirkanmaa', 'Satakunta', 'South Karelia', 'Southern Ostrobothnia', 'Southern Savonia', 'Southwest Finland', 'Tavastia Proper', 'Uusimaa'],
    'IE': ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'],
    'NZ': ['Auckland', 'Bay of Plenty', 'Canterbury', 'Chatham Islands', 'Gisborne', 'Hawke\'s Bay', 'Manawatu-Wanganui', 'Marlborough', 'Nelson', 'Northland', 'Otago', 'Southland', 'Taranaki', 'Tasman', 'Waikato', 'Wellington', 'West Coast'],
    'EG': ['Alexandria', 'Aswan', 'Asyut', 'Beheira', 'Beni Suef', 'Cairo', 'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Ismailia', 'Kafr el-Sheikh', 'Luxor', 'Matruh', 'Minya', 'Monufia', 'New Valley', 'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharqia', 'Sohag', 'South Sinai', 'Suez'],
    'SA': ['Al Bahah', 'Al Jawf', 'Al Madinah', 'Al Qassim', 'Eastern Province', 'Ha\'il', 'Jazan', 'Makkah', 'Najran', 'Northern Borders', 'Riyadh', 'Tabuk'],
    'AE': ['Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras al-Khaimah', 'Sharjah', 'Umm al-Quwain']
  };

  const states = staticData[countryCode];
  if (states) {
    return states.map(name => ({ name, code: name }));
  }
  return null;
};

export const profileService = {
  getMyProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/profile/update', profileData);
    return response.data;
  },

  uploadPhoto: async (photoFile, privacy = 'public', coinCost = 0) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('privacy', privacy);
    if (privacy === 'private' && coinCost > 0) {
      formData.append('coinCost', coinCost.toString());
    }
    const response = await api.post('/profile/upload-photo', formData);
    return response.data;
  },

  deletePhoto: async (photoId) => {
    const response = await api.delete(`/profile/photo/${photoId}`);
    return response.data;
  },

  updatePhotoPrivacy: async (photoId, privacy, coinCost = 0) => {
    const body = { privacy };
    if (privacy === 'private' && coinCost > 0) {
      body.coinCost = coinCost;
    } else if (privacy === 'public') {
      body.coinCost = 0;
    }
    const response = await api.put(`/profile/photo/${photoId}/privacy`, body);
    return response.data;
  },

  viewProfile: async (userId) => {
    const response = await api.get(`/profile/view/${userId}`);
    return response.data;
  },

  viewPrivatePhoto: async (userId, photoId) => {
    const response = await api.post(`/profile/view-private-photo/${userId}/${photoId}`);
    return response.data;
  },

  unlockPrivatePhoto: async (photoId) => {
    const response = await api.post('/private-photo/unlock', { photoId });
    return response.data;
  },

  getVerificationStatus: async () => {
    const response = await api.get('/profile/verification/status');
    return response.data;
  },

  submitVerification: async (evidenceFile) => {
    const formData = new FormData();
    formData.append('evidence', evidenceFile);
    const response = await api.post('/profile/verification/submit', formData);
    return response.data;
  },

  submitPhotoVerification: async (formData) => {
    const response = await api.post('/auth/photo-verification', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadVerificationPhoto: async (formData) => {
    const response = await api.post('/verification-requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.put('/preferences/update', preferences);
    return response.data;
  },

  getInterests: async () => {
    const response = await api.get('/public/interests');
    return response.data;
  },

  getRelationGoals: async () => {
    const response = await api.get('/public/relation-goals');
    return response.data;
  },

  getReligions: async () => {
    const response = await api.get('/public/religions');
    return response.data;
  },

  // Fetch countries from REST Countries API
  getCountries: async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3');
      const data = await response.json();
      return {
        success: true,
        countries: data.map(country => ({
          name: country.name.common,
          code: country.cca2,
          code3: country.cca3,
        })).sort((a, b) => a.name.localeCompare(b.name))
      };
    } catch (error) {
      return { success: false, countries: [] };
    }
  },

  // Fetch states for a country using multiple API sources
  getStatesByCountry: async (countryCode) => {
    try {
      // Method 1: Try GeoNames search API with ADM1 (administrative level 1 - states/provinces)
      try {
        const geoNamesResponse = await fetch(
          `https://secure.geonames.org/searchJSON?country=${countryCode}&featureCode=ADM1&maxRows=500&username=demo&style=full`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (geoNamesResponse.ok) {
          const geoNamesData = await geoNamesResponse.json();

          // Check for API errors
          if (geoNamesData.status) {
          } else if (geoNamesData?.geonames && geoNamesData.geonames.length > 0) {
            const states = geoNamesData.geonames.map(place => ({
              name: place.name,
              code: place.adminCode1 || place.geonameId?.toString() || place.name,
            })).sort((a, b) => a.name.localeCompare(b.name));

            // Remove duplicates based on name
            const uniqueStates = states.filter((state, index, self) =>
              index === self.findIndex(s => s.name.toLowerCase() === state.name.toLowerCase())
            );

            if (uniqueStates.length > 0) {
              return {
                success: true,
                states: uniqueStates
              };
            }
          }
        } else {
        }
      } catch (geoNamesError) {
      }

      // Method 1b: Try GeoNames children API (get country's geonameId first, then children)
      try {
        // First get country name from REST Countries
        const countryNameResponse = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const countryNameData = await countryNameResponse.json();
        const countryInfo = Array.isArray(countryNameData) ? countryNameData[0] : countryNameData;
        const countryName = countryInfo?.name?.common || countryInfo?.name;

        if (countryName) {
          // Get country's geonameId using country name
          const countryInfoResponse = await fetch(
            `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(countryName)}&featureClass=A&featureCode=PCLI&maxRows=1&username=demo`
          );

          if (countryInfoResponse.ok) {
            const countryInfoData = await countryInfoResponse.json();
            if (countryInfoData?.geonames && countryInfoData.geonames.length > 0) {
              // Find the exact country match
              const countryMatch = countryInfoData.geonames.find(
                place => place.countryCode === countryCode.toUpperCase()
              ) || countryInfoData.geonames[0];

              const countryGeonameId = countryMatch.geonameId;

              // Get children (states) of the country
              const childrenResponse = await fetch(
                `https://secure.geonames.org/childrenJSON?geonameId=${countryGeonameId}&username=demo`
              );

              if (childrenResponse.ok) {
                const childrenData = await childrenResponse.json();

                if (childrenData?.geonames && childrenData.geonames.length > 0) {
                  // Filter for ADM1 level (states/provinces)
                  const states = childrenData.geonames
                    .filter(place => place.fcode === 'ADM1' || place.fcodeName?.includes('first-order'))
                    .map(place => ({
                      name: place.name,
                      code: place.adminCode1 || place.geonameId?.toString() || place.name,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));

                  // Remove duplicates
                  const uniqueStates = states.filter((state, index, self) =>
                    index === self.findIndex(s => s.name.toLowerCase() === state.name.toLowerCase())
                  );

                  if (uniqueStates.length > 0) {
                    return {
                      success: true,
                      states: uniqueStates
                    };
                  }
                }
              }
            }
          }
        }
      } catch (childrenError) {
      }

      // Method 2: Try REST Countries API with full data (includes subdivisions)
      try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,subdivisions`);
        if (response.ok) {
          const data = await response.json();

          // Handle array response
          const countryData = Array.isArray(data) ? data[0] : data;

          if (countryData?.subdivisions && Object.keys(countryData.subdivisions).length > 0) {
            const states = Object.values(countryData.subdivisions).map(sub => ({
              name: sub.name,
              code: sub.code || sub.name,
            })).sort((a, b) => a.name.localeCompare(b.name));

            return {
              success: true,
              states: states
            };
          }
        }
      } catch (restError) {
      }

      // Method 3: Try GeoNames with country name search (alternative approach)
      try {
        const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=name`);
        if (countryResponse.ok) {
          const countryData = await countryResponse.json();
          const country = Array.isArray(countryData) ? countryData[0] : countryData;
          const countryName = country?.name?.common || country?.name;

          if (countryName) {
            const geoNamesSearchResponse = await fetch(
              `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(countryName)}&featureCode=ADM1&maxRows=500&username=demo&style=full`
            );

            if (geoNamesSearchResponse.ok) {
              const searchData = await geoNamesSearchResponse.json();

              if (!searchData.status && searchData?.geonames && searchData.geonames.length > 0) {
                // Filter by country code to ensure we get the right country's states
                const states = searchData.geonames
                  .filter(place => place.countryCode === countryCode.toUpperCase())
                  .map(place => ({
                    name: place.name,
                    code: place.adminCode1 || place.geonameId?.toString() || place.name,
                  }))
                  .sort((a, b) => a.name.localeCompare(b.name));

                // Remove duplicates
                const uniqueStates = states.filter((state, index, self) =>
                  index === self.findIndex(s => s.name.toLowerCase() === state.name.toLowerCase())
                );

                if (uniqueStates.length > 0) {
                  return {
                    success: true,
                    states: uniqueStates
                  };
                }
              }
            }
          }
        }
      } catch (altError) {
      }

      // Method 4: Static fallback - comprehensive data for all major countries
      const staticStates = getStaticStates(countryCode);
      if (staticStates && staticStates.length > 0) {
        return {
          success: true,
          states: staticStates
        };
      }

      // Method 5: Final attempt - try GeoNames with country code directly (no feature code filter)
      try {
        const finalResponse = await fetch(
          `https://secure.geonames.org/searchJSON?country=${countryCode}&featureClass=A&maxRows=500&username=demo&style=full`
        );

        if (finalResponse.ok) {
          const finalData = await finalResponse.json();

          if (!finalData.status && finalData?.geonames && finalData.geonames.length > 0) {
            // Filter for administrative divisions (ADM1, ADM2, etc.)
            const states = finalData.geonames
              .filter(place => place.fcode && (place.fcode.startsWith('ADM') || place.fcodeName?.includes('administrative')))
              .map(place => ({
                name: place.name,
                code: place.adminCode1 || place.geonameId?.toString() || place.name,
              }))
              .sort((a, b) => a.name.localeCompare(b.name));

            // Remove duplicates
            const uniqueStates = states.filter((state, index, self) =>
              index === self.findIndex(s => s.name.toLowerCase() === state.name.toLowerCase())
            );

            if (uniqueStates.length > 0) {
              return {
                success: true,
                states: uniqueStates
              };
            }
          }
        }
      } catch (finalError) {
      }

      // If all methods fail, return empty array
      return { success: true, states: [] };
    } catch (error) {
      return { success: false, states: [], error: error.message };
    }
  },
};


export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: '1', name: 'Advocacia', icon: 'gavel' },
  { id: '2', name: 'Agronomia', icon: 'grass' },
  { id: '3', name: 'Alfaiataria', icon: 'checkroom' },
  { id: '4', name: 'Alvenaria', icon: 'domain' },
  { id: '5', name: 'Ar Condicionado', icon: 'ac-unit' },
  { id: '6', name: 'Arquitetura', icon: 'architecture' },
  { id: '7', name: 'Assistência Técnica', icon: 'phonelink-setup' },
  { id: '8', name: 'Aulas Particulares', icon: 'school' },
  { id: '9', name: 'Automação Residencial', icon: 'smart-toy' },
  { id: '10', name: 'Borracharia', icon: 'tire-repair' },
  { id: '11', name: 'Carpintaria', icon: 'carpenter' },
  { id: '12', name: 'Chaveiro', icon: 'vpn-key' },
  { id: '13', name: 'Coaching', icon: 'psychology' },
  { id: '14', name: 'Confeitaria', icon: 'cake' },
  { id: '15', name: 'Construção Civil', icon: 'construction' },
  { id: '16', name: 'Consultoria', icon: 'support-agent' },
  { id: '17', name: 'Contabilidade', icon: 'calculate' },
  { id: '18', name: 'Costura e Reforma', icon: 'checkroom' },
  { id: '19', name: 'Cuidador de Idosos', icon: 'elderly' },
  { id: '20', name: 'Decoração', icon: 'color-lens' },
  { id: '21', name: 'Dedetização', icon: 'pest-control' },
  { id: '22', name: 'Dentista', icon: 'medical-services' },
  { id: '23', name: 'Design Gráfico', icon: 'design-services' },
  { id: '24', name: 'Despachante', icon: 'description' },
  { id: '25', name: 'Diarista', icon: 'cleaning-services' },
  { id: '26', name: 'DJ / Sonorização', icon: 'music-note' },
  { id: '27', name: 'Eletricista', icon: 'electrical-services' },
  { id: '28', name: 'Encanador', icon: 'plumbing' },
  { id: '29', name: 'Energia Solar', icon: 'solar-power' },
  { id: '30', name: 'Engenharia', icon: 'engineering' },
  { id: '31', name: 'Estética e Beleza', icon: 'spa' },
  { id: '32', name: 'Eventos', icon: 'celebration' },
  { id: '33', name: 'Fisioterapia', icon: 'accessibility-new' },
  { id: '34', name: 'Fotografia', icon: 'camera-alt' },
  { id: '35', name: 'Frete e Mudança', icon: 'local-shipping' },
  { id: '36', name: 'Funilaria e Pintura Automotiva', icon: 'car-repair' },
  { id: '37', name: 'Gesseiro', icon: 'format-paint' },
  { id: '38', name: 'Guincho', icon: 'rv-hookup' },
  { id: '39', name: 'Hidráulica', icon: 'water-drop' },
  { id: '40', name: 'Impermeabilização', icon: 'roofing' },
  { id: '41', name: 'Instalação de TV / Internet', icon: 'settings-input-antenna' },
  { id: '42', name: 'Jardinagem', icon: 'yard' },
  { id: '43', name: 'Limpeza Residencial', icon: 'cleaning-services' },
  { id: '44', name: 'Limpeza Comercial', icon: 'store' },
  { id: '45', name: 'Limpeza de Piscina', icon: 'pool' },
  { id: '46', name: 'Manutenção Predial', icon: 'apartment' },
  { id: '47', name: 'Marcenaria', icon: 'handyman' },
  { id: '48', name: 'Marketing Digital', icon: 'campaign' },
  { id: '49', name: 'Mecânica Automotiva', icon: 'build' },
  { id: '50', name: 'Medicina / Saúde', icon: 'local-hospital' },
  { id: '51', name: 'Montagem de Móveis', icon: 'chair' },
  { id: '52', name: 'Motorista Particular', icon: 'directions-car' },
  { id: '53', name: 'Mudança', icon: 'move-to-inbox' },
  { id: '54', name: 'Nutrição', icon: 'restaurant' },
  { id: '55', name: 'Paisagismo', icon: 'park' },
  { id: '56', name: 'Pedreiro', icon: 'foundation' },
  { id: '57', name: 'Personal Trainer', icon: 'fitness-center' },
  { id: '58', name: 'Pet Shop / Veterinário', icon: 'pets' },
  { id: '59', name: 'Pintura', icon: 'format-paint' },
  { id: '60', name: 'Piso e Revestimento', icon: 'grid-on' },
  { id: '61', name: 'Programação / TI', icon: 'code' },
  { id: '62', name: 'Psicologia', icon: 'psychology' },
  { id: '63', name: 'Refrigeração', icon: 'kitchen' },
  { id: '64', name: 'Segurança Eletrônica', icon: 'videocam' },
  { id: '65', name: 'Segurança Patrimonial', icon: 'security' },
  { id: '66', name: 'Serralheria', icon: 'iron' },
  { id: '67', name: 'Serviços Gerais', icon: 'miscellaneous-services' },
  { id: '68', name: 'Telhado e Cobertura', icon: 'roofing' },
  { id: '69', name: 'Topografia', icon: 'terrain' },
  { id: '70', name: 'Tradução', icon: 'translate' },
  { id: '71', name: 'Transporte Escolar', icon: 'directions-bus' },
  { id: '72', name: 'Vidraçaria', icon: 'window' },
  { id: '73', name: 'Outros', icon: 'more-horiz' },
];

export const SERVICE_CATEGORY_NAMES = SERVICE_CATEGORIES.map(c => c.name);

export const getCategoryIcon = (categoryName: string): string => {
  const found = SERVICE_CATEGORIES.find(c => c.name === categoryName);
  return found?.icon || 'miscellaneous-services';
};

export const filterCategories = (query: string): ServiceCategory[] => {
  if (!query.trim()) return SERVICE_CATEGORIES;
  const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return SERVICE_CATEGORIES.filter(c => {
    const catNormalized = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return catNormalized.includes(normalized);
  });
};

export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function localeOrEnglish(value: unknown): Locale {
  return isLocale(value) ? value : "en";
}

export const languageNames: Record<Locale, string> = {
  en: "English",
  pt: "Português",
};

const portuguese: Record<string, string> = {
  Overview: "Visão geral",
  Calendar: "Agenda",
  "Revenue protection": "Proteção de receita",
  "Revenue recovery": "Recuperação de receita",
  Customers: "Clientes",
  Services: "Serviços",
  Team: "Equipa",
  "Opening hours": "Horário",
  "Brand & business": "Marca e negócio",
  "YOUR BUSINESS": "O SEU NEGÓCIO",
  "Team workspace": "Área da equipa",
  "Business workspace": "Área do negócio",
  "Platform support": "Suporte da plataforma",
  "Business owner": "Proprietário",
  Manager: "Gestor",
  "Staff member": "Membro da equipa",
  "Sign out": "Terminar sessão",
  "Open menu": "Abrir menu",
  "Close menu": "Fechar menu",
  "Preview your page": "Pré-visualizar página",
  "Your shop. Your own experience.": "O seu espaço. A sua experiência.",
  "Your business": "O seu negócio",
  "View customer page": "Ver página do cliente",
  "Built around your business.": "Criado à volta do seu negócio.",
  "Private workspace": "Área privada",
  "Platform support mode": "Modo de suporte da plataforma",
  "Back to client": "Voltar ao cliente",
  "Customer details are hidden and appointment changes are disabled.":
    "Os dados dos clientes estão ocultos e as alterações às marcações estão desativadas.",
  "Make yourself known": "Dê a conhecer o seu negócio",
  "The details that turn a booking page into your barbershop.":
    "Os detalhes que transformam uma página de marcações no seu espaço.",
  "Preview customer page": "Pré-visualizar página do cliente",
  "Business details": "Dados do negócio",
  "How customers see and find your shop.":
    "Como os clientes veem e encontram o seu espaço.",
  "Only the business owner can change these details.":
    "Apenas o proprietário pode alterar estes dados.",
  "Your logo": "O seu logótipo",
  "Logo uploads are managed by the owner.":
    "O carregamento do logótipo é gerido pelo proprietário.",
  "Your booking address": "O seu endereço de marcações",
  Verified: "Verificado",
  "Awaiting verification": "A aguardar verificação",
  "Your shop’s settings and team are isolated from other businesses.":
    "As definições e a equipa do seu espaço estão isoladas de outros negócios.",
  Language: "Idioma",
  "Choose the language used in the private workspace and on the public customer experience.":
    "Escolha o idioma utilizado na área privada e na experiência pública dos clientes.",
  "Owner workspace language": "Idioma da área do proprietário",
  "Public shop and booking language":
    "Idioma da página pública e das marcações",
  "Save language settings": "Guardar idiomas",
  "Language settings saved.": "Idiomas guardados.",
  "Only the business owner can change language settings.":
    "Apenas o proprietário pode alterar os idiomas.",
  "UNMISTAKABLY YOURS": "INEQUIVOCAMENTE SEU",
  "YOUR BRAND, AT A GLANCE": "A SUA MARCA, NUM RELANCE",
  "Custom domains use the same tenant registry. Connecting a live domain is a later deployment step.":
    "Os domínios personalizados utilizam o mesmo registo do espaço. A ligação de um domínio real será feita numa fase posterior.",
  "Business name": "Nome do negócio",
  Tagline: "Slogan",
  "About your shop": "Sobre o seu espaço",
  Address: "Morada",
  "Contact number": "Número de contacto",
  "Brand colour": "Cor da marca",
  "Sets the colour system across your customer page and booking flow.":
    "Define o sistema de cores da página pública e do processo de marcação.",
  "Save business details": "Guardar dados do negócio",
  "Shop logo": "Logótipo do espaço",
  "PNG, JPEG or WebP. Up to 2 MB. Your logo is publicly visible.":
    "PNG, JPEG ou WebP. Até 2 MB. O logótipo fica visível publicamente.",
  "Upload logo": "Carregar logótipo",
  "Close dialog": "Fechar janela",
  "Service name": "Nome do serviço",
  "e.g. Signature cut": "ex.: Corte de assinatura",
  Description: "Descrição",
  "What’s included in the experience?": "O que está incluído na experiência?",
  Category: "Categoria",
  "Price (€)": "Preço (€)",
  "Duration (minutes)": "Duração (minutos)",
  "Buffer after (minutes)": "Intervalo depois (minutos)",
  "Active and available for new bookings":
    "Ativo e disponível para novas marcações",
  "Turn this off to archive the service. Existing appointments and reporting history will be preserved.":
    "Desative esta opção para arquivar o serviço. As marcações existentes e o histórico serão preservados.",
  "Save service": "Guardar serviço",
  "Add service": "Adicionar serviço",
  "Add a service": "Adicionar um serviço",
  "Full name": "Nome completo",
  "Role / title": "Função / título",
  "About this barber": "Sobre este barbeiro",
  "Services they offer": "Serviços que presta",
  "(hidden)": "(oculto)",
  "Active team member": "Membro ativo da equipa",
  "A team profile does not grant access to the owner workspace.":
    "Um perfil de equipa não concede acesso à área do proprietário.",
  "Save team member": "Guardar membro da equipa",
  "Add team member": "Adicionar membro da equipa",
  "Add a team member": "Adicionar um membro da equipa",
  DAY: "DIA",
  "WORKING HOURS": "HORÁRIO DE TRABALHO",
  BREAK: "PAUSA",
  "opening time": "hora de abertura",
  "closing time": "hora de fecho",
  "break start": "início da pausa",
  "break end": "fim da pausa",
  hours: "horas",
  "per week": "por semana",
  "Save working hours": "Guardar horário",
  Reason: "Motivo",
  "e.g. Annual leave": "ex.: Férias",
  "e.g. Christmas holiday": "ex.: Encerramento de Natal",
  "First day": "Primeiro dia",
  "Last day (inclusive)": "Último dia (inclusive)",
  "All-day exception, in the shop’s local timezone.":
    "Exceção de dia inteiro no fuso horário do espaço.",
  "Add time off": "Adicionar ausência",
  "Add closure": "Adicionar encerramento",
  "Remove exception": "Remover exceção",
  "Time off": "Ausências",
  "Special closures": "Encerramentos especiais",
  "Exceptions to your regular week.": "Exceções ao horário habitual.",
  "No time off scheduled.": "Não existem ausências agendadas.",
  "No special closures scheduled.":
    "Não existem encerramentos especiais agendados.",
  "THE CRAFT, CONSIDERED": "O OFÍCIO, COM CUIDADO",
  "Your service menu": "Os seus serviços",
  "Good experiences start with clear expectations.":
    "Boas experiências começam com expectativas claras.",
  Current: "Atuais",
  Archived: "Arquivados",
  All: "Todos",
  "Service status": "Estado do serviço",
  "Service category": "Categoria do serviço",
  "All services": "Todos os serviços",
  "Search services": "Pesquisar serviços",
  "Find a service…": "Encontrar um serviço…",
  "On the menu": "No menu",
  "No description added yet.": "Ainda não foi adicionada uma descrição.",
  "min buffer": "min de intervalo",
  "Edit service": "Editar serviço",
  Edit: "Editar",
  "Updating…": "A atualizar…",
  "Archive service": "Arquivar serviço",
  "Restore service": "Restaurar serviço",
  "No archived services": "Não existem serviços arquivados",
  "No services found": "Nenhum serviço encontrado",
  "Try another name or category.": "Tente outro nome ou categoria.",
  "Services you archive will appear here with their history preserved.":
    "Os serviços arquivados aparecerão aqui com o histórico preservado.",
  "Add the first service to your menu.": "Adicione o primeiro serviço ao menu.",
  "Add another service": "Adicionar outro serviço",
  "Prices and durations are always set by your business.":
    "Os preços e as durações são sempre definidos pelo seu negócio.",
  "THE PEOPLE MAKE THE PLACE": "AS PESSOAS FAZEM O ESPAÇO",
  "Behind every good cut": "Por detrás de cada bom corte",
  "Your team, their craft, and the time they make available.":
    "A sua equipa, o seu talento e o tempo que disponibilizam.",
  Active: "Ativo",
  Inactive: "Inativo",
  "Add a short introduction to help customers get to know this barber.":
    "Adicione uma breve apresentação para os clientes conhecerem este barbeiro.",
  services: "serviços",
  "hrs / week": "h / semana",
  "Profile & working hours": "Perfil e horário",
  "Team profiles describe availability and services. Workspace access is managed separately.":
    "Os perfis da equipa descrevem a disponibilidade e os serviços. O acesso à área privada é gerido separadamente.",
  "ROOM FOR WORK. TIME FOR LIFE.": "ESPAÇO PARA TRABALHAR. TEMPO PARA VIVER.",
  "Your regular rhythm": "O seu ritmo habitual",
  "Set the shop’s opening hours and make space for a proper break.":
    "Defina o horário do espaço e reserve tempo para uma pausa adequada.",
  "Your customer page uses this weekly schedule.":
    "A página pública utiliza este horário semanal.",
  "Weekly schedule": "Horário semanal",
  "Individual working hours and time off can be adjusted in each team member’s profile.":
    "O horário individual e as ausências podem ser ajustados no perfil de cada membro da equipa.",
  "THE BIG PICTURE": "A VISÃO GERAL",
  "A good day starts here": "Um bom dia começa aqui",
  "Preview your shop": "Pré-visualizar o espaço",
  "Make it your own": "Personalize-o",
  "Business name, brand and contact details":
    "Nome do negócio, marca e contactos",
  "Build your service menu": "Crie o menu de serviços",
  "Bring your team together": "Reúna a sua equipa",
  "Set your working week": "Defina a semana de trabalho",
  "TODAY AT A GLANCE": "HOJE, NUM RELANCE",
  "A live snapshot of your own schedule.": "Uma visão atual do seu horário.",
  "A live operational snapshot for the whole shop.":
    "Uma visão operacional atual de todo o espaço.",
  "Open calendar": "Abrir agenda",
  "Still ahead today": "Ainda hoje",
  "confirmed visits": "visitas confirmadas",
  "Needs an outcome": "Precisa de resultado",
  "past or ongoing confirmed visits":
    "visitas confirmadas passadas ou em curso",
  "Completed-service value": "Valor de serviços concluídos",
  "completed today · not collected revenue":
    "concluídos hoje · não representa receita recebida",
  "Customers due": "Clientes a contactar",
  "potential service value": "valor potencial de serviços",
  "REBOOKING OPPORTUNITIES": "OPORTUNIDADES DE REMARCAÇÃO",
  "Right customer. Right moment.": "O cliente certo. No momento certo.",
  "Explainable timing signals based on each customer’s completed visit history.":
    "Sinais de tempo explicáveis com base no histórico de visitas concluídas de cada cliente.",
  "Open all customers": "Ver todos os clientes",
  Summary: "Resumo",
  "Customers due or due soon": "Clientes na data habitual ou quase",
  "Potential service value": "Valor potencial dos serviços",
  "Recorded outreach actions": "Contactos registados",
  "Appointments attributed": "Marcações atribuídas",
  "service value": "valor dos serviços",
  "Potential and attributed service values use appointment prices. They are not collected or recovered revenue.":
    "Os valores potenciais e atribuídos utilizam os preços das marcações. Não representam receita recebida ou recuperada.",
  "Noma records outreach but does not send messages. Outreach is available only after an explicit email opt-in has been recorded. Profiles with future bookings, unresolved visits or possible duplicate identities are excluded.":
    "A Noma regista o contacto, mas não envia mensagens. O contacto só está disponível depois de ser registado um consentimento explícito por email. São excluídos os perfis com marcações futuras, visitas por resolver ou possíveis identidades duplicadas.",
  "Customers due to return": "Clientes na altura habitual de regressar",
  "Most recent service": "Serviço mais recente",
  "Previous team member unavailable": "Membro anterior da equipa indisponível",
  "Potential value": "Valor potencial",
  "not recovered revenue": "não representa receita recuperada",
  "Email outreach recorded": "Contacto por email registado",
  "appointment attributed": "marcação atribuída",
  "awaiting outcome": "a aguardar resultado",
  "No marketing opt-in": "Sem consentimento de marketing",
  "Record outreach": "Registar contacto",
  "View profile": "Ver perfil",
  "Book & attribute": "Marcar e atribuir",
  "Book next visit": "Marcar próxima visita",
  "No customers are due right now.":
    "Não há clientes na data habitual de regresso neste momento.",
  "Opportunities appear after at least three completed visit days establish a customer’s typical return interval.":
    "As oportunidades aparecem depois de pelo menos três dias de visitas concluídas estabelecerem o intervalo habitual de regresso do cliente.",
  "Showing the 100 most overdue opportunities.":
    "A mostrar as 100 oportunidades mais atrasadas.",
  "Message sent": "Mensagem enviada",
  "I sent this message through an approved business email channel.":
    "Enviei esta mensagem através de um canal de email aprovado pelo negócio.",
  "Noma records this action but does not send the email. A booking can be attributed to it for 30 days.":
    "A Noma regista esta ação, mas não envia o email. Uma marcação pode ser-lhe atribuída durante 30 dias.",
  "Record email outreach": "Registar contacto por email",
  "Outreach recorded for attribution.": "Contacto registado para atribuição.",
  "Coming up": "A seguir",
  "Portugal local time": "Hora local de Portugal",
  "Customer details hidden": "Dados do cliente ocultos",
  "No more confirmed visits today.":
    "Não existem mais visitas confirmadas hoje.",
  "YOUR FOUNDATION IS TAKING SHAPE": "A SUA BASE ESTÁ A GANHAR FORMA",
  "More time for the craft.": "Mais tempo para o ofício.",
  "Less time on the rest.": "Menos tempo para o resto.",
  "Your services, your people, your opening hours.":
    "Os seus serviços, a sua equipa, o seu horário.",
  "Everything starts with a shop that feels like you.":
    "Tudo começa com um espaço que tem a sua identidade.",
  "Make it yours": "Personalizar",
  "YOUR NEIGHBOURHOOD SHOP": "O ESPAÇO DO SEU BAIRRO",
  "CRAFTED AROUND YOU.": "CRIADO À SUA MEDIDA.",
  "A considered experience for every customer":
    "Uma experiência cuidada para cada cliente",
  "Behind the chair": "Atrás da cadeira",
  barbers: "barbeiros",
  "The people who make your shop": "As pessoas que fazem o seu espaço",
  "Your working week": "A sua semana de trabalho",
  "hours open": "horas de abertura",
  "Working time, with breaks accounted for":
    "Tempo de trabalho, incluindo as pausas",
  "A STRONG START": "UM COMEÇO FORTE",
  "Your shop essentials": "O essencial do seu espaço",
  "These details shape your customer experience.":
    "Estes detalhes moldam a experiência dos clientes.",
  "AT A GLANCE": "NUM RELANCE",
  "The regular week": "A semana habitual",
  "Shop-local time · Breaks shown in working hours":
    "Hora local · Pausas indicadas no horário de trabalho",
  "GOOD HANDS": "BOAS MÃOS",
  "The people behind your shop": "As pessoas por detrás do seu espaço",
  "Meet the team": "Conhecer a equipa",
  "YOUR APPOINTMENTS": "AS SUAS MARCAÇÕES",
  "A calendar built around your day.": "Uma agenda criada à volta do seu dia.",
  "Online appointments, rescheduling and a clear view of what’s ahead. Ready when you are.":
    "Marcações online, alterações e uma visão clara do que vem a seguir. Pronto quando estiver.",
  "A taste of your menu": "Uma amostra do seu menu",
  "Saving…": "A guardar…",
  "here are your appointment details.": "aqui estão os dados da sua marcação.",
  "Choose a service, barber and valid date.":
    "Escolha um serviço, um barbeiro e uma data válida.",
  "Invalid request origin.": "Origem do pedido inválida.",
  "Request too large.": "O pedido é demasiado grande.",
  "Invalid request.": "Pedido inválido.",
  "Check your booking details.": "Verifique os dados da marcação.",
  "TIME WELL SPENT": "TEMPO BEM PASSADO",
  "Your day, in good hands.": "O seu dia, em boas mãos.",
  "Your appointments and the people coming to see you.":
    "As suas marcações e as pessoas que o vêm visitar.",
  "A clear view of who’s coming in and what’s next.":
    "Uma visão clara de quem vem e do que se segue.",
  "New appointment": "Nova marcação",
  "Previous day": "Dia anterior",
  "Next day": "Dia seguinte",
  "My schedule": "O meu horário",
  "All barbers": "Todos os barbeiros",
  "Show day": "Mostrar dia",
  Today: "Hoje",
  "scheduled value · unpaid": "valor agendado · não pago",
  "Appointments for selected day": "Marcações do dia selecionado",
  "A little room in the day.": "Ainda há espaço no dia.",
  "No appointments for this date and barber.":
    "Não existem marcações para esta data e barbeiro.",
  "New bookings will appear here once confirmed.":
    "As novas marcações aparecerão aqui depois de confirmadas.",
  to: "até",
  Reschedule: "Alterar horário",
  Cancel: "Cancelar",
  "Mark completed": "Marcar como concluída",
  "Mark no-show": "Marcar falta",
  "Save new time": "Guardar novo horário",
  "Cancel this appointment and release the time?":
    "Cancelar esta marcação e libertar o horário?",
  "Mark this customer as a no-show?": "Marcar este cliente como falta?",
  "Couldn’t save the change. Reload and try again.":
    "Não foi possível guardar a alteração. Recarregue e tente novamente.",
  "Changes to working hours apply to new bookings. Review existing appointments before adding leave or closures.":
    "As alterações ao horário aplicam-se a novas marcações. Reveja as marcações existentes antes de adicionar ausências ou encerramentos.",
  "Customer page preview": "Pré-visualização da página do cliente",
  "Fictional demo shop": "Espaço de demonstração fictício",
  "Preview only": "Apenas pré-visualização",
  "Demo appointments · No payments":
    "Marcações de demonstração · Sem pagamentos",
  "Online booking is not open yet":
    "As marcações online ainda não estão disponíveis",
  "Our services": "Os nossos serviços",
  "YOUR NEIGHBOURHOOD BARBERSHOP": "A BARBEARIA DO SEU BAIRRO",
  "Find your next favourite cut": "Encontre o seu próximo corte favorito",
  "THE ART OF LOOKING YOURSELF.": "A ARTE DE SE SENTIR BEM.",
  "Book a visit": "Marcar uma visita",
  "A LITTLE TIME, WELL SPENT": "UM POUCO DE TEMPO BEM PASSADO",
  "The service menu.": "Os nossos serviços.",
  "Expert hands. Thoughtful details. No rush.":
    "Mãos experientes. Detalhes cuidados. Sem pressa.",
  minutes: "minutos",
  "A good day starts with a little time for you.":
    "Um bom dia começa com algum tempo para si.",
  "Your customer experience.": "A experiência dos seus clientes.",
  "This is a fictional shop. Demo bookings are saved locally; no payments are accepted.":
    "Este é um espaço fictício. As marcações de demonstração são guardadas localmente e não são aceites pagamentos.",
  "Our online appointment service is not open yet.":
    "O nosso serviço de marcações online ainda não está disponível.",
  "GOOD PEOPLE. GREAT CRAFT.": "BOAS PESSOAS. GRANDE TALENTO.",
  "Find your barber.": "Encontre o seu barbeiro.",
  "COME AS YOU ARE": "VENHA COMO É",
  "Make yourself at home.": "Sinta-se em casa.",
  "demo number": "número de demonstração",
  "Our regular hours": "Horário habitual",
  Closed: "Fechado",
  Hair: "Cabelo",
  Beard: "Barba",
  Rituals: "Rituais",
  "Breaks and special closures may apply.":
    "Podem aplicar-se pausas e encerramentos especiais.",
  "Book your next visit.": "Marque a sua próxima visita.",
  "Your service. Your barber. A time that suits you.":
    "O seu serviço. O seu barbeiro. Uma hora à sua medida.",
  "01 · YOUR VISIT": "01 · A SUA VISITA",
  Service: "Serviço",
  Barber: "Barbeiro",
  "02 · MAKE TIME FOR YOURSELF": "02 · RESERVE TEMPO PARA SI",
  Date: "Data",
  "Times in Portugal · Book 30 minutes to 90 days ahead.":
    "Hora de Portugal · Marque entre 30 minutos e 90 dias de antecedência.",
  "Finding available times…": "A procurar horários disponíveis…",
  "Choose your service and barber first.":
    "Escolha primeiro o serviço e o barbeiro.",
  "No times available. Try another day or barber.":
    "Não há horários disponíveis. Tente outro dia ou barbeiro.",
  "Available times": "Horários disponíveis",
  "03 · A FEW DETAILS": "03 · ALGUNS DADOS",
  "Your name": "O seu nome",
  "Email address": "Endereço de email",
  "We use these details for your appointment. You are not signing up for marketing.":
    "Utilizamos estes dados para a sua marcação. Não está a subscrever comunicações de marketing.",
  "Choose an available time to continue.":
    "Escolha um horário disponível para continuar.",
  "Pay at the shop. Cancel or reschedule free before your appointment starts using your private link.":
    "Pague no local. Cancele ou altere gratuitamente antes da marcação através da sua ligação privada.",
  "Fictional shop: use made-up contact details. No email or payment is sent.":
    "Espaço fictício: utilize dados de contacto inventados. Não é enviado qualquer email ou pagamento.",
  "Fictional shop: use made-up contact details. Deposit decisions are simulated; no payment is processed.":
    "Espaço fictício: utilize dados de contacto inventados. As decisões de depósito são simuladas; nenhum pagamento é processado.",
  "Booking your visit…": "A marcar a sua visita…",
  "Confirm appointment": "Confirmar marcação",
  "Unable to load times.": "Não foi possível carregar os horários.",
  "Couldn’t book. Please try again.":
    "Não foi possível concluir a marcação. Tente novamente.",
  "Back to the shop": "Voltar ao espaço",
  "Your appointment.": "A sua marcação.",
  "Open the complete private link you saved after booking.":
    "Abra a ligação privada completa que guardou após a marcação.",
  "Finding your appointment…": "A procurar a sua marcação…",
  "Your time is reserved.": "O seu horário está reservado.",
  "Your appointment is cancelled.": "A sua marcação foi cancelada.",
  "Your visit.": "A sua visita.",
  With: "Com",
  "Pay at the shop": "Pague no local",
  "Save your private booking link": "Guarde a sua ligação privada",
  "This link lets anyone holding it manage this appointment. Keep it private. Email delivery is not enabled in this demo.":
    "Esta ligação permite gerir a marcação. Mantenha-a privada. O envio de email não está ativo nesta demonstração.",
  "Link copied": "Ligação copiada",
  "Copy private link": "Copiar ligação privada",
  "Free cancellation and rescheduling before the appointment starts.":
    "Cancelamento e alteração gratuitos antes do início da marcação.",
  "Choose another time": "Escolher outro horário",
  "Cancel appointment": "Cancelar marcação",
  "Choose a new time": "Escolher um novo horário",
  "Confirm new time": "Confirmar novo horário",
  "Book another visit": "Marcar outra visita",
  "Please try again.": "Tente novamente.",
  "Deposit status": "Estado do depósito",
  "BOOKING DEPOSIT": "DEPÓSITO DA MARCAÇÃO",
  "Demo payment disabled": "Pagamento de demonstração desativado",
  "Opening payment…": "A abrir pagamento…",
  "Pay deposit": "Pagar depósito",
  "Your deposit refund is due.": "O reembolso do seu depósito está pendente.",
  "No booking deposit is required.":
    "Não é necessário depósito para esta marcação.",
  "Cancel before the refund deadline to keep the deposit refundable. Rescheduling moves the deadline with the appointment.":
    "Cancele antes do prazo de reembolso para manter o depósito reembolsável. Ao alterar a marcação, o prazo acompanha a nova data.",
  "The payment page could not be opened.":
    "Não foi possível abrir a página de pagamento.",
  "Payments are disabled for this fictional shop.":
    "Os pagamentos estão desativados neste espaço fictício.",
  "Online deposit payments are not configured.":
    "Os pagamentos de depósitos online não estão configurados.",
  "The deposit is already paid.": "O depósito já está pago.",
  "This appointment cannot accept a deposit.":
    "Esta marcação não pode receber um depósito.",
  "REVENUE PROTECTION": "PROTEÇÃO DE RECEITA",
  "Protect the appointment, fairly.": "Proteja a marcação de forma justa.",
  "Explainable attendance risk, clear deposit terms and conservative reporting.":
    "Risco de comparência explicável, condições de depósito claras e relatórios conservadores.",
  "At-risk upcoming visits": "Próximas visitas em risco",
  "Deposits secured": "Depósitos garantidos",
  "Reminders due": "Lembretes pendentes",
  "Protected value": "Valor protegido",
  "Protected value counts only paid deposits retained after a no-show or a cancellation after the refund deadline. It is not total revenue or forecast revenue.":
    "O valor protegido conta apenas depósitos pagos retidos após uma falta ou um cancelamento depois do prazo de reembolso. Não representa receita total nem prevista.",
  POLICY: "POLÍTICA",
  "Set transparent rules": "Defina regras transparentes",
  "Attendance history determines a visible risk tier. No opaque score or protected characteristic is used.":
    "O histórico de comparência determina um nível de risco visível. Não são usadas pontuações opacas nem características protegidas.",
  "Revenue protection enabled": "Proteção de receita ativa",
  "New appointments receive a policy and risk snapshot.":
    "As novas marcações recebem um registo da política e do risco.",
  "Deposit rule": "Regra de depósito",
  "No deposits": "Sem depósitos",
  "Elevated risk only": "Apenas risco elevado",
  "Every appointment": "Todas as marcações",
  "Deposit percentage": "Percentagem do depósito",
  "Refund deadline (hours before)": "Prazo de reembolso (horas antes)",
  "Reminder lead time (hours)": "Antecedência do lembrete (horas)",
  "Policy changes apply only to new appointments. Existing appointments keep the terms agreed when they were booked.":
    "As alterações à política aplicam-se apenas a novas marcações. As marcações existentes mantêm as condições acordadas quando foram efetuadas.",
  "Save protection policy": "Guardar política de proteção",
  "Revenue protection policy saved.":
    "Política de proteção de receita guardada.",
  "Stripe Checkout is configured. Eligible local payment methods are controlled in the Stripe account.":
    "O Stripe Checkout está configurado. Os métodos de pagamento locais elegíveis são controlados na conta Stripe.",
  "Stripe Checkout is not configured. Deposits can be recorded manually for the pilot workflow.":
    "O Stripe Checkout não está configurado. Os depósitos podem ser registados manualmente no fluxo piloto.",
  "ACTION QUEUE": "FILA DE AÇÕES",
  "Visits needing attention": "Visitas que precisam de atenção",
  "standard risk": "risco normal",
  "elevated risk": "risco elevado",
  "high risk": "risco alto",
  Deposit: "Depósito",
  Reminder: "Lembrete",
  "not required": "não necessário",
  pending: "pendente",
  paid: "pago",
  "refund due": "reembolso pendente",
  refunded: "reembolsado",
  retained: "retido",
  upcoming: "agendado",
  due: "pendente",
  sent: "enviado",
  "deposit due": "de depósito pendente",
  "Record deposit paid": "Registar depósito pago",
  "Deposit recorded.": "Depósito registado.",
  "I sent the appointment reminder through an approved channel.":
    "Enviei o lembrete da marcação através de um canal aprovado.",
  "Record reminder": "Registar lembrete",
  "Reminder recorded.": "Lembrete registado.",
  "Refund deposit": "Reembolsar depósito",
  "Deposit refunded.": "Depósito reembolsado.",
  "Refund due": "Reembolso pendente",
  "Nothing needs attention.": "Nada precisa de atenção.",
  "Deposits, refunds and reminders are up to date.":
    "Os depósitos, reembolsos e lembretes estão atualizados.",
  EVIDENCE: "EVIDÊNCIA",
  "Protected value ledger": "Registo de valor protegido",
  "late cancellation": "cancelamento tardio",
  "Check the protection policy.": "Verifique a política de proteção.",
  "The change could not be saved.": "Não foi possível guardar a alteração.",
  "Invalid appointment.": "Marcação inválida.",
  "Invalid payment.": "Pagamento inválido.",
  "This deposit cannot be refunded.": "Este depósito não pode ser reembolsado.",
  "Stripe refunds are not configured.":
    "Os reembolsos Stripe não estão configurados.",
  "REVENUE RECOVERY": "RECUPERAÇÃO DE RECEITA",
  "Put released time back to work.": "Volte a rentabilizar o tempo libertado.",
  "Match cancelled appointments to consented customer requests, with evidence from contact to outcome.":
    "Associe marcações canceladas a pedidos consentidos de clientes, com evidência desde o contacto até ao resultado.",
  "Add waitlist request": "Adicionar pedido à lista de espera",
  "Add a customer to the waitlist": "Adicionar cliente à lista de espera",
  "Open cancelled slots": "Vagas de cancelamento abertas",
  "Customer matches": "Clientes correspondentes",
  "Recovery contacts": "Contactos de recuperação",
  "booked service value": "valor de serviços marcados",
  "Recovered value counts only attributed appointments that were completed.":
    "O valor recuperado conta apenas marcações atribuídas que foram concluídas.",
  "Noma does not send messages. Matches require recorded email consent and use only the requested service, date window and optional team preference.":
    "A Noma não envia mensagens. As correspondências exigem consentimento de email registado e utilizam apenas o serviço, o intervalo de datas e a preferência opcional de profissional.",
  "Cancellation matches": "Correspondências de cancelamentos",
  "RELEASED TIME": "HORÁRIO LIBERTADO",
  "current service value": "valor atual do serviço",
  "WAITLIST MATCH": "CORRESPONDÊNCIA NA LISTA",
  "Service and date window match; any team member accepted":
    "Serviço e intervalo de datas correspondem; qualquer profissional aceite",
  "Service, preferred team member and date window match":
    "Serviço, profissional preferido e intervalo de datas correspondem",
  "Recovery contact recorded": "Contacto de recuperação registado",
  "Record contact": "Registar contacto",
  "No cancellation matches right now.":
    "Não existem correspondências de cancelamentos neste momento.",
  "Future cancellations appear here when they match an active waitlist request.":
    "Os cancelamentos futuros aparecem aqui quando correspondem a um pedido ativo na lista de espera.",
  WAITLIST: "LISTA DE ESPERA",
  "Active customer requests": "Pedidos ativos de clientes",
  "Customer unavailable": "Cliente indisponível",
  "Service unavailable": "Serviço indisponível",
  "Date window": "Intervalo de datas",
  "Team preference": "Preferência de profissional",
  "Any available team member": "Qualquer profissional disponível",
  "No active waitlist requests.":
    "Não existem pedidos ativos na lista de espera.",
  Customer: "Cliente",
  "Preferred team member": "Profissional preferido",
  From: "De",
  Until: "Até",
  "Add to waitlist": "Adicionar à lista de espera",
  "Record email consent on a customer profile before adding a waitlist request.":
    "Registe o consentimento de email no perfil do cliente antes de adicionar um pedido à lista de espera.",
  "Add an active service before creating a waitlist request.":
    "Adicione um serviço ativo antes de criar um pedido na lista de espera.",
  "Close request": "Fechar pedido",
  "Noma records this action but does not send the email.":
    "A Noma regista esta ação, mas não envia o email.",
  "Record recovery contact": "Registar contacto de recuperação",
  "The customer accepted this exact time.":
    "O cliente aceitou este horário exato.",
  "Book released time": "Marcar horário libertado",
  "Cancel this appointment? Your time will be released.":
    "Cancelar esta marcação? O horário ficará novamente disponível.",
  "Copy the full address from your browser to save your link.":
    "Copie o endereço completo do navegador para guardar a sua ligação.",
  confirmed: "confirmada",
  cancelled: "cancelada",
  completed: "concluída",
  "no show": "falta",
};

export function translate(locale: Locale, text: string): string {
  return locale === "pt" ? (portuguese[text] ?? text) : text;
}

export function translator(locale: Locale) {
  return (text: string) => translate(locale, text);
}

export const weekdayNames: Record<Locale, string[]> = {
  en: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  pt: [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ],
};

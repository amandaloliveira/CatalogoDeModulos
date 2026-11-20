// Função auxiliar para gerar avatares SVG estilizados em azul/roxo
function createSvgAvatar(initials, bg1, bg2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/>
    </linearGradient></defs>
    <rect width="120" height="120" rx="60" fill="url(#g)"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="42" font-weight="700">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const AVATAR_PRESETS = [
  createSvgAvatar('BZ', '#2563eb', '#7c3aed'),
  createSvgAvatar('DV', '#0284c7', '#4f46e5'),
  createSvgAvatar('GR', '#7c3aed', '#db2777'),
  createSvgAvatar('AD', '#1d4ed8', '#0f172a')
];

// Usuários extraídos da aba "Usuários" da planilha
const INITIAL_USERS = [
  {
    id: 1,
    name: 'Bruno Ide',
    username: 'brun.ide',
    password: '123456',
    email: 'bruno.ide@bitzar.com.br',
    role: 'Administrador',
    specialty: 'Arquitetura de Software, PostgreSQL & DevOps',
    active: true,
    avatar: createSvgAvatar('BI', '#7c3aed', '#2563eb')
  },
  {
    id: 2,
    name: 'Breno Miyata',
    username: 'bren.miya',
    password: '123456',
    email: 'breno.miyata@bitzar.com.br',
    role: 'Gerente',
    specialty: 'Gestão Ágil, Escopo de Projetos & Orçamentos',
    active: true,
    avatar: createSvgAvatar('BM', '#2563eb', '#06b6d4')
  },
  {
    id: 3,
    name: 'Amanda Oliveira',
    username: 'mandi.oli',
    password: '123456',
    email: 'amanda.oliveira@bitzar.com.br',
    role: 'Desenvolvedor',
    specialty: 'Backend Node.js, APIs REST & Segurança',
    active: true,
    avatar: createSvgAvatar('AO', '#4f46e5', '#9333ea')
  },
  {
    id: 4,
    name: 'Gabriel Hanry',
    username: 'hanry.gab',
    password: '123456',
    email: 'gabriel.hanry@bitzar.com.br',
    role: 'Desenvolvedor',
    specialty: 'Fullstack React, Integrações & Pagamentos',
    active: true,
    avatar: createSvgAvatar('GH', '#1d4ed8', '#6d28d9')
  }
];

// 15 Categorias extraídas da aba "Categorias" da planilha
const INITIAL_CATEGORIES = [
  { id: 1, name: 'Segurança' },
  { id: 2, name: 'Pagamentos' },
  { id: 3, name: 'Comunicação' },
  { id: 4, name: 'Arquivos' },
  { id: 5, name: 'Usuários' },
  { id: 6, name: 'Relatórios' },
  { id: 7, name: 'Banco de Dados' },
  { id: 8, name: 'Integrações' },
  { id: 9, name: 'Autenticação' },
  { id: 10, name: 'E-commerce' },
  { id: 11, name: 'Agendamento' },
  { id: 12, name: 'Localização' },
  { id: 13, name: 'Auditoria' },
  { id: 14, name: 'Interface' },
  { id: 15, name: 'Busca' }
];

// Helper para montar arquivos estilo GitHub automaticamente para cada módulo
function buildRepoFiles(slug, tech, codeSnippet, readmeText, deps) {
  return {
    'src/index.js': codeSnippet,
    'src/config.js': `// Configurações padrão do módulo ${slug}\nexport const moduleConfig = {\n  name: "${slug}",\n  engine: "${tech}",\n  timeoutMs: 5000,\n  retries: 2\n};\n`,
    'tests/module.test.js': `import assert from 'node:assert';\nimport { executeModule } from '../src/index.js';\n\ndescribe('${slug}', () => {\n  it('deve executar o fluxo principal com sucesso', async () => {\n    const res = await executeModule({ sample: true });\n    assert.equal(res.ok, true);\n  });\n});\n`,
    'package.json': JSON.stringify(
      {
        name: `@bitzar/${slug}`,
        version: '1.0.0',
        main: 'src/index.js',
        dependencies: deps || { dotenv: '^16.4.0' }
      },
      null,
      2
    ),
    'README.md': readmeText
  };
}

// Módulos representativos das 15 categorias da planilha "Módulos e Exemplos.xlsx"
const INITIAL_MODULES = [
  {
    id: 1,
    name: 'Login',
    description: 'Autentica usuários e inicia uma sessão segura na aplicação com validação de credenciais.',
    categoryId: 1,
    technology: 'JSON Web Token (jsonwebtoken)',
    version: '9.x',
    status: 'Ativo',
    link: 'https://github.com/auth0/node-jsonwebtoken',
    docLink: 'https://github.com/auth0/node-jsonwebtoken#readme',
    authorId: 1,
    dependencies: 'jsonwebtoken@^9.0.2, bcrypt@^6.0.0',
    files: buildRepoFiles(
      'login-seguro',
      'JSON Web Token (jsonwebtoken)',
      `import jwt from 'jsonwebtoken';\n\nexport async function loginUsuario({ username, passwordHash, userRecord }) {\n  if (!userRecord || userRecord.passwordHash !== passwordHash) {\n    throw new Error('Credenciais inválidas.');\n  }\n  const token = jwt.sign(\n    { sub: userRecord.id, role: userRecord.role },\n    process.env.JWT_SECRET,\n    { expiresIn: '8h' }\n  );\n  return { ok: true, token, user: userRecord.username };\n}`,
      `# Módulo: Login Seguro\n\nAutentica usuários da aplicação e gera sessão via **JWT**.\n\n## Instalação\n\`\`\`bash\nnpm install @bitzar/login-seguro\n\`\`\`\n\n## Como Utilizar\n\`\`\`js\nimport { loginUsuario } from '@bitzar/login-seguro';\nconst sessao = await loginUsuario({ username, passwordHash, userRecord });\n\`\`\``,
      { jsonwebtoken: '^9.0.2', bcrypt: '^6.0.0' }
    )
  },
  {
    id: 2,
    name: 'Autenticação JWT',
    description: 'Gera e valida tokens JWT para autenticação stateless entre cliente e servidor.',
    categoryId: 1,
    technology: 'JSON Web Token (jsonwebtoken)',
    version: '9.x',
    status: 'Ativo',
    link: 'https://github.com/auth0/node-jsonwebtoken',
    docLink: 'https://github.com/auth0/node-jsonwebtoken#readme',
    authorId: 3,
    dependencies: 'jsonwebtoken@^9.0.2',
    files: buildRepoFiles(
      'autenticacao-jwt',
      'JSON Web Token',
      `import jwt from 'jsonwebtoken';\n\nexport function verificarTokenMiddleware(req, res, next) {\n  const authHeader = req.headers.authorization;\n  if (!authHeader) return res.status(401).json({ erro: 'Token ausente' });\n\n  const [, token] = authHeader.split(' ');\n  try {\n    req.usuario = jwt.verify(token, process.env.JWT_SECRET);\n    return next();\n  } catch {\n    return res.status(403).json({ erro: 'Token expirado ou inválido' });\n  }\n}`,
      `# Autenticação JWT\n\nMiddleware reutilizável para proteção de rotas REST na arquitetura Bitzar.\n\n## Variáveis de Ambiente\n- \`JWT_SECRET\`: Chave privada de assinatura HS256.\n\n## Exemplo\n\`\`\`js\napp.get('/api/protegida', verificarTokenMiddleware, controller);\n\`\`\``,
      { jsonwebtoken: '^9.0.2' }
    )
  },
  {
    id: 7,
    name: 'Criptografia de Senhas',
    description: 'Armazena senhas usando funções de hash resistentes a ataques de força bruta.',
    categoryId: 1,
    technology: 'bcrypt',
    version: '6.x',
    status: 'Ativo',
    link: 'https://github.com/kelektiv/node.bcrypt.js',
    docLink: 'https://github.com/kelektiv/node.bcrypt.js#readme',
    authorId: 4,
    dependencies: 'bcrypt@^6.0.0',
    files: buildRepoFiles(
      'criptografia-senhas',
      'bcrypt 6.x',
      `import bcrypt from 'bcrypt';\n\nconst SALT_ROUNDS = 12;\n\nexport async function gerarHashSenha(senhaPlana) {\n  return bcrypt.hash(senhaPlana, SALT_ROUNDS);\n}\n\nexport async function compararSenha(senhaPlana, hashSalvo) {\n  return bcrypt.compare(senhaPlana, hashSalvo);\n}`,
      `# Criptografia de Senhas (bcrypt)\n\nEncapsula a geração e verificação de hashes com \`saltRounds = 12\`.`,
      { bcrypt: '^6.0.0' }
    )
  },
  {
    id: 14,
    name: 'PIX',
    description: 'Permite gerar cobranças instantâneas e consultar pagamentos via PIX por meio da API Asaas.',
    categoryId: 2,
    technology: 'Asaas API',
    version: 'v3',
    status: 'Ativo',
    link: 'https://www.asaas.com/',
    docLink: 'https://docs.asaas.com/',
    authorId: 4,
    dependencies: 'axios@^1.7.0',
    files: buildRepoFiles(
      'pagamento-pix',
      'Asaas API v3',
      `export async function criarCobrancaPix({ customerId, value, description }) {\n  const response = await fetch('https://api.asaas.com/v3/payments', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      access_token: process.env.ASAAS_API_KEY\n    },\n    body: JSON.stringify({\n      customer: customerId,\n      billingType: 'PIX',\n      value,\n      description\n    })\n  });\n  return response.json();\n}`,
      `# Módulo de Pagamento PIX (Asaas v3)\n\nGera QR Code dinâmico, payload copia-e-cola e acompanha liquidação via Webhook.\n\n## Requisitos\n- Chave \`ASAAS_API_KEY\` configurada no \`.env\`.`,
      { axios: '^1.7.0' }
    )
  },
  {
    id: 15,
    name: 'Cartão de Crédito',
    description: 'Processa pagamentos com cartão de crédito, tokenização e acompanha autorização.',
    categoryId: 2,
    technology: 'Stripe API',
    version: '2025-06-30.basil',
    status: 'Ativo',
    link: 'https://stripe.com/',
    docLink: 'https://docs.stripe.com/',
    authorId: 3,
    dependencies: 'stripe@^17.0.0',
    files: buildRepoFiles(
      'cartao-credito-stripe',
      'Stripe API',
      `import Stripe from 'stripe';\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY);\n\nexport async function cobrarCartao({ amountCents, currency = 'brl', paymentMethodId }) {\n  return stripe.paymentIntents.create({\n    amount: amountCents,\n    currency,\n    payment_method: paymentMethodId,\n    confirm: true\n  });\n}`,
      `# Cartão de Crédito (Stripe)\n\nProcessamento seguro PCI-compliant utilizando \`PaymentIntents\`.`,
      { stripe: '^17.0.0' }
    )
  },
  {
    id: 17,
    name: 'Boleto Bancário',
    description: 'Gera boletos registrados, consulta vencimentos e acompanha a liquidação das cobranças.',
    categoryId: 2,
    technology: 'Asaas API',
    version: 'v3',
    status: 'Ativo',
    link: 'https://www.asaas.com/',
    docLink: 'https://docs.asaas.com/',
    authorId: 3,
    dependencies: 'axios@^1.7.0',
    files: buildRepoFiles(
      'gerador-boleto',
      'Asaas API v3',
      `export async function emitirBoleto({ customerId, value, dueDate }) {\n  return {\n    billingType: 'BOLETO',\n    customer: customerId,\n    value,\n    dueDate,\n    status: 'PENDING'\n  };\n}`,
      `# Emissão de Boleto Bancário\n\nGera linha digitável e PDF do boleto integrado ao gateway.`,
      { axios: '^1.7.0' }
    )
  },
  {
    id: 26,
    name: 'Envio de E-mail',
    description: 'Envia mensagens de e-mail transacionais ou informativas para usuários via SendGrid.',
    categoryId: 3,
    technology: 'Twilio SendGrid',
    version: 'API v3',
    status: 'Ativo',
    link: 'https://sendgrid.com/',
    docLink: 'https://www.twilio.com/docs/sendgrid',
    authorId: 3,
    dependencies: '@sendgrid/mail@^8.1.0',
    files: buildRepoFiles(
      'envio-email-sendgrid',
      'Twilio SendGrid v3',
      `import sgMail from '@sendgrid/mail';\nsgMail.setApiKey(process.env.SENDGRID_API_KEY);\n\nexport async function enviarEmail({ to, subject, html }) {\n  return sgMail.send({\n    to,\n    from: 'no-reply@bitzar.com.br',\n    subject,\n    html\n  });\n}`,
      `# Envio de E-mail Transacional\n\nUtilizado para boas-vindas, recuperação de senha e comprovantes.`,
      { '@sendgrid/mail': '^8.1.0' }
    )
  },
  {
    id: 27,
    name: 'Notificações Push',
    description: 'Centraliza o envio e o gerenciamento de notificações em tempo real para os usuários.',
    categoryId: 3,
    technology: 'Firebase Cloud Messaging',
    version: 'API',
    status: 'Ativo',
    link: 'https://firebase.google.com/',
    docLink: 'https://firebase.google.com/docs/cloud-messaging',
    authorId: 4,
    dependencies: 'firebase-admin@^13.0.0',
    files: buildRepoFiles(
      'notificacoes-fcm',
      'Firebase Cloud Messaging',
      `export async function dispararPush({ deviceToken, title, body }) {\n  return {\n    messageId: 'fcm_' + Date.now(),\n    target: deviceToken,\n    notification: { title, body }\n  };\n}`,
      `# Notificações Push (FCM)\n\nDisparo multiplataforma (Web, Android e iOS) via Firebase.`,
      { 'firebase-admin': '^13.0.0' }
    )
  },
  {
    id: 38,
    name: 'Upload de Arquivos',
    description: 'Permite upload seguro de arquivos com validação de MIME type e armazenamento em nuvem.',
    categoryId: 4,
    technology: 'Amazon S3',
    version: 'API',
    status: 'Ativo',
    link: 'https://aws.amazon.com/s3/',
    docLink: 'https://docs.aws.amazon.com/s3/',
    authorId: 3,
    dependencies: '@aws-sdk/client-s3@^3.600.0',
    files: buildRepoFiles(
      'upload-arquivos-s3',
      'Amazon S3 SDK v3',
      `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';\nconst s3 = new S3Client({ region: 'sa-east-1' });\n\nexport async function uploadArquivo({ bucket, key, buffer, contentType }) {\n  await s3.send(new PutObjectCommand({\n    Bucket: bucket,\n    Key: key,\n    Body: buffer,\n    ContentType: contentType\n  }));\n  return \`https://\${bucket}.s3.sa-east-1.amazonaws.com/\${key}\`;\n}`,
      `# Upload de Arquivos (Amazon S3)\n\nEnvia documentos e imagens diretamente para buckets S3 na região \`sa-east-1\`.`,
      { '@aws-sdk/client-s3': '^3.600.0' }
    )
  },
  {
    id: 50,
    name: 'Cadastro de Usuários',
    description: 'Gerencia registro, validação de duplicidade e persistência de usuários no banco.',
    categoryId: 5,
    technology: 'PostgreSQL',
    version: '18.x',
    status: 'Ativo',
    link: 'https://www.postgresql.org/',
    docLink: 'https://www.postgresql.org/docs/current/',
    authorId: 4,
    dependencies: 'pg@^8.13.0',
    files: buildRepoFiles(
      'cadastro-usuarios-pg',
      'PostgreSQL 18.x',
      `export async function criarUsuario(db, { nome, email, senhaHash, cargo }) {\n  const query = \`INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, cargo\`;\n  const { rows } = await db.query(query, [nome, email, senhaHash, cargo]);\n  return rows[0];\n}`,
      `# Cadastro de Usuários\n\nRepositório SQL parametrizado contra SQL Injection.`,
      { pg: '^8.13.0' }
    )
  },
  {
    id: 63,
    name: 'Exportação para PDF',
    description: 'Gera relatórios e comprovantes estruturados em PDF prontos para download.',
    categoryId: 6,
    technology: 'PDFKit',
    version: '0.17.x',
    status: 'Ativo',
    link: 'https://pdfkit.org/',
    docLink: 'https://pdfkit.org/docs/getting_started.html',
    authorId: 3,
    dependencies: 'pdfkit@^0.17.0',
    files: buildRepoFiles(
      'exportacao-pdf',
      'PDFKit 0.17',
      `import PDFDocument from 'pdfkit';\n\nexport function gerarRelatorioPDF(titulo, linhas, streamSaida) {\n  const doc = new PDFDocument();\n  doc.pipe(streamSaida);\n  doc.fontSize(18).text(titulo, { underline: true });\n  linhas.forEach(l => doc.fontSize(11).text(l));\n  doc.end();\n}`,
      `# Exportação para PDF\n\nCria documentos PDF dinâmicos via streams Node.js.`,
      { pdfkit: '^0.17.0' }
    )
  },
  {
    id: 74,
    name: 'CRUD & Consulta Estruturada',
    description: 'Abstração de cadastro, paginação e consulta de dados com operações estruturadas.',
    categoryId: 7,
    technology: 'PostgreSQL',
    version: '18.x',
    status: 'Ativo',
    link: 'https://www.postgresql.org/',
    docLink: 'https://www.postgresql.org/docs/current/',
    authorId: 1,
    dependencies: 'pg@^8.13.0',
    files: buildRepoFiles(
      'crud-postgres',
      'PostgreSQL 18.x',
      `export async function listarPaginado(db, tabela, page = 1, limit = 20) {\n  const offset = (page - 1) * limit;\n  const { rows } = await db.query(\`SELECT * FROM \${tabela} LIMIT $1 OFFSET $2\`, [limit, offset]);\n  return rows;\n}`,
      `# CRUD & Paginação PostgreSQL\n\nPadroniza consultas paginadas de alta performance.`,
      { pg: '^8.13.0' }
    )
  },
  {
    id: 86,
    name: 'API REST & Webhooks',
    description: 'Disponibiliza recursos da aplicação via endpoints HTTP REST padronizados e eventos Webhook.',
    categoryId: 8,
    technology: 'OpenAPI',
    version: '3.1',
    status: 'Ativo',
    link: 'https://www.openapis.org/',
    docLink: 'https://spec.openapis.org/oas/latest.html',
    authorId: 3,
    dependencies: 'express@^5.0.0',
    files: buildRepoFiles(
      'api-rest-openapi',
      'OpenAPI / Express 5',
      `export function registrarWebhook(evento, callbackUrl) {\n  return { evento, callbackUrl, ativo: true, criadoEm: new Date().toISOString() };\n}`,
      `# API REST & Webhooks\n\nPadrão de contratos HTTP para integração com sistemas externos (ERP/CRM).`,
      { express: '^5.0.0' }
    )
  },
  {
    id: 102,
    name: 'Controle de Permissões por Perfil (RBAC)',
    description: 'Restringe acesso a rotas e funcionalidades conforme o cargo (Desenvolvedor, Gerente, Admin).',
    categoryId: 9,
    technology: 'PostgreSQL',
    version: '18.x',
    status: 'Ativo',
    link: 'https://www.postgresql.org/',
    docLink: 'https://www.postgresql.org/docs/current/',
    authorId: 1,
    dependencies: 'express@^5.0.0',
    files: buildRepoFiles(
      'rbac-permissoes',
      'RBAC Middleware',
      `export function exigirPerfil(...perfisPermitidos) {\n  return (req, res, next) => {\n    if (!perfisPermitidos.includes(req.usuario?.role)) {\n      return res.status(403).json({ erro: 'Acesso negado para o seu perfil.' });\n    }\n    next();\n  };\n}`,
      `# Controle de Acesso Baseado em Perfis (RBAC)\n\nGarante segregação de funções entre Desenvolvedor, Gerente e Administrador.`,
      { express: '^5.0.0' }
    )
  },
  {
    id: 110,
    name: 'Carrinho de Compras & Checkout',
    description: 'Gerencia itens do carrinho, cálculo de subtotais, cupons e fechamento de pedido.',
    categoryId: 10,
    technology: 'PostgreSQL',
    version: '18.x',
    status: 'Ativo',
    link: 'https://www.postgresql.org/',
    docLink: 'https://www.postgresql.org/docs/current/',
    authorId: 4,
    dependencies: 'pg@^8.13.0',
    files: buildRepoFiles(
      'carrinho-checkout',
      'PostgreSQL 18.x',
      `export function calcularTotalCarrinho(itens, descontoPercent = 0) {\n  const bruto = itens.reduce((acc, item) => acc + item.preco * item.qtd, 0);\n  return Number((bruto * (1 - descontoPercent / 100)).toFixed(2));\n}`,
      `# Carrinho de Compras & Checkout\n\nCalcula totais, aplica cupons de desconto e prepara payload de pagamento.`,
      { pg: '^8.13.0' }
    )
  },
  {
    id: 123,
    name: 'Calendário & Agendamento de Serviços',
    description: 'Organiza datas, disponibilidade de horários, profissionais e bloqueios de agenda.',
    categoryId: 11,
    technology: 'iCalendar / RFC 5545',
    version: 'RFC 5545',
    status: 'Ativo',
    link: 'https://www.rfc-editor.org/rfc/rfc5545',
    docLink: 'https://www.rfc-editor.org/rfc/rfc5545',
    authorId: 3,
    dependencies: 'ical-generator@^8.0.0',
    files: buildRepoFiles(
      'calendario-agendamento',
      'iCalendar RFC 5545',
      `export function verificarConflitoHorario(agendaExistente, novoInicio, novoFim) {\n  return agendaExistente.some(slot => novoInicio < slot.fim && novoFim > slot.inicio);\n}`,
      `# Calendário & Agendamento\n\nValida conflitos de horários e exporta eventos compatíveis com Google Calendar/Outlook.`,
      { 'ical-generator': '^8.0.0' }
    )
  },
  {
    id: 136,
    name: 'Consulta de CEP & Endereço',
    description: 'Consulta automática de logradouro, bairro, cidade e UF a partir do CEP.',
    categoryId: 12,
    technology: 'ViaCEP',
    version: 'v1',
    status: 'Ativo',
    link: 'https://viacep.com.br/',
    docLink: 'https://viacep.com.br/',
    authorId: 4,
    dependencies: 'node-fetch@^3.3.0',
    files: buildRepoFiles(
      'consulta-cep',
      'ViaCEP API v1',
      `export async function buscarCep(cep) {\n  const limpo = cep.replace(/\\D/g, '');\n  const res = await fetch(\`https://viacep.com.br/ws/\${limpo}/json/\`);\n  return res.json();\n}`,
      `# Consulta de CEP (ViaCEP)\n\nPreenche formulários de endereço automaticamente no Brasil.`,
      {}
    )
  },
  {
    id: 147,
    name: 'Logs & Auditoria de Operações',
    description: 'Registra atividades, alterações de usuários e rastreamento de ações para auditoria.',
    categoryId: 13,
    technology: 'OpenSearch',
    version: '3.x',
    status: 'Ativo',
    link: 'https://opensearch.org/',
    docLink: 'https://docs.opensearch.org/',
    authorId: 1,
    dependencies: '@opensearch-project/opensearch@^3.0.0',
    files: buildRepoFiles(
      'auditoria-logs',
      'OpenSearch 3.x',
      `export function registrarAuditoria({ userId, acao, recurso }) {\n  return {\n    timestamp: new Date().toISOString(),\n    userId,\n    acao,\n    recurso\n  };\n}`,
      `# Auditoria & Logs do Sistema\n\nRastreabilidade completa de ações críticas para conformidade LGPD.`,
      { '@opensearch-project/opensearch': '^3.0.0' }
    )
  },
  {
    id: 160,
    name: 'Tabela de Dados & Formulários UI',
    description: 'Componentes reutilizáveis de interface para listagens, filtros e formulários.',
    categoryId: 14,
    technology: 'React 19.x / Bootstrap 5.3',
    version: '19.x',
    status: 'Ativo',
    link: 'https://react.dev/',
    docLink: 'https://react.dev/reference/react',
    authorId: 4,
    dependencies: 'react@^19.0.0',
    files: buildRepoFiles(
      'ui-tabela-dados',
      'React 19.x',
      `export function filtrarLinhasTabela(dados, termo) {\n  const q = termo.toLowerCase();\n  return dados.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));\n}`,
      `# Componentes UI (Tabela & Formulários)\n\nPadroniza o Design System interno dos sistemas Bitzar.`,
      { react: '^19.0.0' }
    )
  },
  {
    id: 173,
    name: 'Pesquisa por Palavra-Chave & Autocomplete',
    description: 'Localiza registros indexados com base em múltiplos critérios e sugestões instantâneas.',
    categoryId: 15,
    technology: 'Elasticsearch',
    version: '9.x',
    status: 'Ativo',
    link: 'https://www.elastic.co/elasticsearch',
    docLink: 'https://www.elastic.co/docs',
    authorId: 3,
    dependencies: '@elastic/elasticsearch@^9.0.0',
    files: buildRepoFiles(
      'busca-elasticsearch',
      'Elasticsearch 9.x',
      `export function buscarPorPalavrasChave(lista, keywords) {\n  return lista.filter(item => keywords.some(k => item.nome.toLowerCase().includes(k.toLowerCase())));\n}`,
      `# Pesquisa Indexada & Autocomplete\n\nMotor de busca rápida utilizado inclusive para sugerir módulos em novos projetos.`,
      { '@elastic/elasticsearch': '^9.0.0' }
    )
  },
  {
    id: 185,
    name: 'Integração WhatsApp Business',
    description: 'Envia notificações e mensagens automáticas via WhatsApp Cloud API (aguardando revisão de segurança).',
    categoryId: 3,
    technology: 'WhatsApp Business Platform',
    version: 'Cloud API',
    status: 'Em Aprovação',
    link: 'https://business.whatsapp.com/',
    docLink: 'https://developers.facebook.com/docs/whatsapp/cloud-api/',
    authorId: 3,
    dependencies: 'axios@^1.7.0',
    files: buildRepoFiles(
      'whatsapp-cloud-api',
      'WhatsApp Cloud API',
      `export async function enviarWhatsApp({ phone, templateName }) {\n  return { status: 'queued', to: phone, template: templateName };\n}`,
      `# Integração WhatsApp Business\n\nMódulo recém-submetido por Amanda Oliveira. Aguardando aprovação do Administrador.`,
      { axios: '^1.7.0' }
    )
  }
];

// Projetos iniciais cobrindo os status solicitados
const INITIAL_PROJECTS = [
  {
    id: 101,
    name: 'Portal E-commerce OmniStore',
    client: 'Grupo Varejo Brasil S.A.',
    description: 'Plataforma completa de vendas B2C com checkout transparente, pagamento via PIX/Cartão e cálculo de CEP.',
    status: 'Em Andamento',
    requirements: ['login', 'pix', 'cartão', 'carrinho', 'cep', 'e-mail'],
    attachedModuleIds: [1, 14, 15, 110, 136, 26],
    createdAt: '2026-09-10',
    finishedAt: '2026-12-15',
    collaboratorIds: [2, 3, 4]
  },
  {
    id: 102,
    name: 'Sistema de Gestão Clínica Vida+',
    client: 'Rede Médica Vida+',
    description: 'Sistema de agendamento de consultas, prontuários em PDF e notificações automáticas aos pacientes.',
    status: 'Novo Projeto',
    requirements: ['autenticação', 'agendamento', 'calendário', 'pdf', 'notificações'],
    attachedModuleIds: [2, 123, 63, 27],
    createdAt: '2026-11-05',
    finishedAt: '2027-02-20',
    collaboratorIds: [2, 3]
  },
  {
    id: 103,
    name: 'Portal Corporativo & Auditoria FinTech',
    client: 'CredSeguros Financeira',
    description: 'Portal interno com controle estrito de perfis RBAC, upload de documentos em nuvem e trilha de auditoria.',
    status: 'Em Avaliação',
    requirements: ['rbac', 'criptografia', 'upload', 'auditoria', 'logs'],
    attachedModuleIds: [102, 7, 38, 147],
    createdAt: '2026-08-01',
    finishedAt: '2026-11-30',
    collaboratorIds: [1, 2, 3]
  },
  {
    id: 104,
    name: 'App Logística Express',
    client: 'TransRápido Logística',
    description: 'Painel de rastreamento de entregas, busca indexada de pedidos e integração REST com ERP.',
    status: 'Aprovado',
    requirements: ['api rest', 'busca', 'cep', 'crud'],
    attachedModuleIds: [86, 173, 136, 74],
    createdAt: '2026-10-12',
    finishedAt: '2027-01-10',
    collaboratorIds: [2, 4]
  },
  {
    id: 105,
    name: 'Marketplace Educacional EduTech',
    client: 'Instituto Saber Digital',
    description: 'Plataforma de venda de cursos online com emissão de boletos e relatórios gerenciais.',
    status: 'Finalizado',
    requirements: ['login', 'boleto', 'e-mail', 'pdf'],
    attachedModuleIds: [1, 17, 26, 63],
    createdAt: '2026-03-15',
    finishedAt: '2026-07-28',
    collaboratorIds: [1, 2, 3, 4]
  },
  {
    id: 106,
    name: 'Integrador Legado Mainframe',
    client: 'Indústrias MetalSul',
    description: 'Conector customizado para banco proprietário sem suporte a APIs modernas.',
    status: 'Reprovado',
    requirements: ['api rest', 'auditoria'],
    attachedModuleIds: [86],
    createdAt: '2026-09-01',
    finishedAt: '2026-09-18',
    collaboratorIds: [2]
  }
];
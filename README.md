# Lyra Service — Frontend

Aplicação React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + React Router 7 para gerenciamento de obras, funcionários e contas. Mantém os componentes e assets locais do Figma. O backend existente é Node.js/Express/Prisma/PostgreSQL, em um projeto separado.

## Instalar e executar

Requisitos: Node.js 24 e npm. No Windows com scripts PowerShell desabilitados, use `npm.cmd` em vez de `npm`.

```sh
npm ci
npm run dev
```

Acesse **http://localhost:5173**. `npm run dev` usa `.env.development`; `npm run dev:api` usa `.env.api`. Ambos iniciam a integração real (somente configuração pública):

```dotenv
VITE_API_URL=http://localhost:3000
VITE_AUTH_MODE=api
VITE_DATA_MODE=api
```

`VITE_API_URL` representa a origem do backend, **sem /api**, credenciais, query ou fragmento. Não coloque segredos em variáveis VITE_*. É possível sobrescrever valores em `.env.api.local`, ignorado pelo Git, ou no ambiente do processo. `VITE_API_BASE_URL` continua como alias antigo quando VITE_API_URL não está definida; configurações novas devem usar VITE_API_URL.

No backend, `FRONTEND_ORIGIN` deve ser exatamente `http://localhost:5173`. Não misture localhost com 127.0.0.1 na integração real: são hosts diferentes para cookies e CORS. O script usa porta fixa para não mudar a origem silenciosamente.

## Executar o backend existente

No diretório `../backend`, em outro terminal, siga o README daquele projeto. Com dependências, PostgreSQL, variáveis privadas e tabelas já preparados:

```sh
npm run prisma:generate
npm run dev
```

O backend deve responder em `http://localhost:3000/health`. A origem do frontend, cookies HttpOnly/SameSite, CSRF e permissões continuam sob as regras do servidor. Não desabilite CORS/CSRF para resolver configuração.

**Verificação em 14/11/2026:** um cadastro autorizado pela interface retornou HTTP 201 e teve sua persistência confirmada no PostgreSQL. O registro permaneceu visível após recarregar a Home e os detalhes. Veja o [diagnóstico de consistência](docs/integration-consistency.md).

Não execute a suíte de testes do backend contra o banco de desenvolvimento: ela faz TRUNCATE e exige uma base separada terminada em _test. Não há .env.test local neste momento.

## Autenticação e permissões

O cliente HTTP usa `credentials: include`, token CSRF apenas em memória e `X-CSRF-Token` em mutações, inclusive login. Renova CSRF após a mudança de sessão; diferencia 403 de autorização e CSRF e não repete mutações automaticamente. Uma falha de comunicação gera erro, nunca dados mock como substitutos.

ApiAuthService converte `password` em `senha` na camada de serviço. Após login consulta `/api/auth/me`, recupera o vínculo real com funcionário e confirma papel/flag de senha provisória. A identificação visual usa o e-mail, pois autenticação não retorna nome completo. Recarregar restaura a sessão pelo cookie e /me. Não há JWT ou persistência de senha/sessão real em localStorage.

Senha provisória direciona para `/alterar-senha` e impede consultas protegidas. Logout está disponível no painel do perfil. Se o servidor não confirmar a saída, a aplicação mostra erro e preserva a sessão visível. Expiração limpa a identidade e os dados em memória. Retomar a aba verifica novamente a sessão; mudança de papel/usuário reinicia o escopo de dados e cancela respostas antigas.

- **ADMIN:** contas, auditoria, funcionários, obras e alocações.
- **GESTOR:** consulta funcionários sem salário; administra obras/alocações.
- **FUNCIONARIO:** consulta somente o próprio funcionário vinculado e as obras/alocações permitidas pelo servidor; não lista todos os funcionários.
- As proteções de interface acompanham as regras fixas do backend. O servidor é a autoridade definitiva.

## Recursos da API

| Recurso | Operações |
|---|---|
| Autenticação | POST login/logout/trocar-senha, GET me em /api/auth |
| Usuários | GET/POST /api/usuarios, PATCH /:id, POST /:id/redefinir-senha |
| Obras | GET coleção/detalhe, POST, PUT, DELETE /api/obras[/:id] |
| Funcionários | GET coleção/detalhe, POST, PUT, DELETE /api/funcionarios[/:id] |
| Alocações | GET coleção/detalhe, POST, PUT, DELETE /api/alocacoes[/:id] |
| Auditoria | GET /api/auditoria?limite=200, ADMIN |

Os serviços convertem IDs entre o modelo visual e IDs numéricos da API e enviam somente propriedades aceitas. Salários permanecem em texto decimal, sem conversão para ponto flutuante; GESTOR não visualiza salário. Alocados não são apresentados como presença em campo. Progresso, presença e outros dados inexistentes permanecem não informados.

Home e listagens compartilham o DataContext. Mutações invalidam coleções relacionadas: alocações atualizam obras e funcionários; exclusões removem os vínculos retornados pelo servidor. O formulário de obra mostra o endereço real da API e aceita datas opcionais. Campos sem persistência ficam indisponíveis no modo API. Apagar valores de data/salário existentes não é permitido pelo schema atual; a interface informa essa limitação.

Exclusões são físicas, com confirmação explícita de irreversibilidade. Excluir funcionário pode desativar sua conta vinculada; não existe exclusão de usuários. Testes destrutivos devem ser feitos apenas com HTTP controlado ou em banco isolado autorizado.

## Recursos pendentes

Documentos, anexos, EPIs, presença diária, progresso físico, contratos/demissão, justificativas, edição de perfil e envio de notificações não têm endpoints correspondentes. Seus layouts e modelos visuais foram preservados, mas o modo API mostra indisponibilidade e não consulta localStorage para preencher coleções ou contadores. A API de auditoria fornece metadados, não snapshots de valores anteriores/posteriores.

A [matriz de compatibilidade](docs/api-compatibility.md) separa campos disponíveis, derivados e ausentes. O [relatório da integração](docs/api-integration.md) apresenta arquivos, contratos, validações e impedimentos. O [inventário do Figma](docs/figma-implementation.md) documenta os 23 frames e as rotas existentes; eventuais descrições históricas de contratos são complementadas pelos dois documentos de integração.

## Modo mock isolado

```sh
npm run dev:mock
```

Somente `.env.mock`, carregado explicitamente com `dev:mock`, mantém **VITE_AUTH_MODE=mock** e **VITE_DATA_MODE=local**. `.env.development` e `.env.production` usam api/api. Ambos devem estar explicitamente habilitados para os registros locais. O modo API não utiliza fallback para mocks. O mock só pode ser ativado com import.meta.env.DEV.

Defina `VITE_MOCK_EMAIL` com um e-mail sintético em domínio `.test` e `VITE_MOCK_PASSWORD` com um valor inventado antes de rodar `npm run dev:mock`. Use o ambiente do processo ou `.env.mock.local` (ignorado pelo Git). Esses valores são públicos no navegador de desenvolvimento. Para rodar as suítes mock, exporte os mesmos valores no terminal que executará os testes. A sessão mock mantém somente os dados públicos mínimos em sessionStorage; não é uma sessão do backend e não autentica usuários reais. Os serviços locais continuam disponíveis para os fluxos anteriores, sem registros demonstrativos iniciais. Dados pessoais transitórios e anexos não são persistidos em localStorage.

## Build e hospedagem

```sh
npm run typecheck
npm run build:api
npm run preview
```

`npm run build` e `npm run build:api` usam `.env.production`, com API real e origem relativa por padrão. Sirva `/api` na mesma origem por meio do servidor ou proxy reverso, ou defina `VITE_API_URL=https://api.exemplo.com` durante o build. Configure fallback da SPA para `index.html` e HTTPS, cookies e CORS conforme o backend. Builds de produção bloqueiam o login mock. O projeto não tem configuração de lint.

## Verificações

`npm run test:real-readonly` exige Vite em localhost:5173 e API em localhost:3000; verifica as variáveis efetivamente servidas, saúde/CORS da API e proteção sem sessão, sem login ou mutações de negócio. Não comprova cadastro/persistência autenticados.

`npm run test:integration-config` verifica que desenvolvimento/produção usam API por padrão, simulação exige modo explícito e a origem de desenvolvimento permanece fixa. As suítes mock exigem um servidor iniciado com `--mode mock`, sem interceptar a aplicação real. Para `test:auth`, o preview de bloqueio de mock deve ser compilado separadamente com `vite build --mode mock --outDir reference/validation/dist-disabled` e servido nessa pasta; o build padrão agora usa API.

As suítes de navegador usam Playwright instalado separadamente, sem novas dependências da aplicação:

```sh
npm install --prefix reference/validation --no-package-lock --no-save playwright
```

No Windows usam Edge quando instalado. Em outro sistema, instale Chromium ou configure PLAYWRIGHT_EXECUTABLE_PATH.

| Comando | Ambiente |
|---|---|
| test:routes, test:data, test:flows | Servidor mock/local; TEST_BASE_URL, padrão 127.0.0.1:5173 |
| test:auth | Mesmo mock, servidor auth desabilitada em TEST_DISABLED_URL e preview com mock bloqueado em TEST_PRODUCTION_URL |
| test:users | Modo api/api, TEST_USERS_URL (padrão 127.0.0.1:5186) |
| test:records-api, test:http-auth, test:api-crud, test:work-deletion | Modo api/api, TEST_RECORDS_URL (padrão 127.0.0.1:5187) |

Os servidores de testes HTTP devem ter **VITE_API_URL=http://127.0.0.1:3000**, porque os testes interceptam exclusivamente essa origem. Exemplo em terminal PowerShell separado:

```powershell
$env:VITE_AUTH_MODE = 'api'
$env:VITE_DATA_MODE = 'api'
$env:VITE_API_URL = 'http://127.0.0.1:3000'
npm.cmd run dev -- --host 127.0.0.1 --port 5187 --strictPort
```

Execute então `npm run test:http-auth`, `npm run test:records-api` e `npm run test:api-crud`. Para test:users, use outro servidor equivalente na porta 5186. Para test:auth, exemplos de servidores adicionais:

```powershell
$env:VITE_AUTH_MODE = 'disabled'
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

```sh
npx vite build --mode mock --outDir reference/validation/dist-disabled
npm run preview -- --outDir reference/validation/dist-disabled --host 127.0.0.1 --port 5175 --strictPort
```

O preview acima testa especificamente o bloqueio de mock em produção. Os testes HTTP controlados não criam, alteram ou excluem registros no backend. Cadastro único autenticado foi validado na API real com autorização e mantido no banco. Novos testes de escrita e exclusão real exigem autorização específica.

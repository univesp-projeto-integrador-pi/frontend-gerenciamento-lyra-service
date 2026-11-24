# Integração do frontend com a API — entrega de 09/11/2026

## Resultado e comprovação

A integração aproveita AuthService, AuthContext, ProtectedRoute/AdminRoute, RecordService, DataContext e os componentes atuais. Há seleção explícita de modos api/api e mock/local, sem fallback entre fontes.

**Comprovado por HTTP controlado:** sessão/cookie, CSRF, autenticação, usuários, obras, funcionários, alocações, permissões, erros, atualização entre módulos e confirmações de exclusão. Os testes usam contextos isolados e respostas HTTP com estado.

**Escopo da primeira rodada:** a API local estava indisponível durante a validação inicial. O [diagnóstico de consistência](integration-consistency.md) registra a verificação posterior de saúde, sessão e criação de obra com persistência.

A abertura real do frontend em http://localhost:5173 foi verificada sem interceptação: a consulta de sessão falha por indisponibilidade da API, a mensagem de conexão é exibida, nenhum módulo protegido é consultado antes do login e não houve erro JavaScript não tratado.

Não foi executada nenhuma operação destrutiva, migration ou seed no banco. Não existe .env.test local. O banco configurado não é uma base de teste identificada por _test; a suíte destrutiva do backend não foi executada.

## Auditoria inicial

O frontend foi lido diretamente em `PI LYRA/PI 2`, incluindo alterações que não estão no clone de publicação. A raiz do frontend não é um repositório Git; o clone em .publication está em feat/implementacao-frontend e foi preservado. Não foram aplicadas alterações na main ou feitos commits/push/PR.

O backend local separado foi consultado: README, Prisma, app.ts, rotas, controllers, schemas, middlewares, sessão e CSRF. Suas modificações preexistentes em docker-compose.yaml e package-lock.json permanecem. Nenhum arquivo de backend foi alterado pela implementação.

A [matriz de compatibilidade](api-compatibility.md) registra campos disponíveis, derivados e ausentes. A configuração pública lida indica API em localhost:3000, frontend permitido em localhost:5173 e PostgreSQL local na porta 5433, compatível com o compose. Valores de senhas, sessão e conexão não foram publicados no relatório ou nos logs.

## Endpoints integrados

| Método | Caminho | Contrato |
|---|---|---|
| GET | /api/csrf-token | Token apenas em memória |
| POST | /api/auth/login | email, senha |
| GET | /api/auth/me | id, email, papel, funcionarioId, precisaTrocarSenha |
| POST | /api/auth/logout | Sem corpo; 204 |
| POST | /api/auth/trocar-senha | senhaAtual, novaSenha; 204 |
| GET / POST | /api/usuarios | Leitura / email?, papel, funcionarioId?, senhaTemporaria |
| PATCH | /api/usuarios/:id | papel?, ativo? |
| POST | /api/usuarios/:id/redefinir-senha | senhaTemporaria; 204 |
| GET | /api/obras e /api/obras/:id | Obra e equipe conforme papel |
| POST / PUT | /api/obras[/:id] | nome, endereco?, status?, dataInicio?, dataFim? |
| DELETE | /api/obras/:id | Exclusão física, 204 |
| GET | /api/funcionarios e /api/funcionarios/:id | Lista autorizada / próprio registro |
| POST / PUT | /api/funcionarios[/:id] | nome, email, cargo?, salario?; atualização parcial |
| DELETE | /api/funcionarios/:id | Exclusão física; conta vinculada desativada; 204 |
| GET | /api/alocacoes e /api/alocacoes/:id | Coleção/detalhe no escopo da sessão |
| POST / PUT | /api/alocacoes[/:id] | funcionarioId e obraId numéricos |
| DELETE | /api/alocacoes/:id | Exclusão física do vínculo, 204 |
| GET | /api/auditoria?limite=200 | Somente ADMIN, metadados recentes |

Não há DELETE de usuários, endpoints de Documentos/EPI ou endpoints inventados para anexos/preferências.

Para completar Documentos, o backend precisará definir contratos de listagem/detalhe/cadastro/edição, upload e download de anexos, vínculo específico com funcionário/obras, renovação e cálculo de validade. Para EPI, serão necessários contratos de catálogo/CA, estoque, entrega/vínculo ao funcionário, condição e substituição. Rotas, DTOs e permissões dessas operações ainda precisam ser definidos pela equipe do backend; nenhum endereço de endpoint foi presumido ou chamado.

## DTOs, dados derivados e diferenças

- Os tipos de transporte são separados em apiModels.ts. Os adapters validam respostas e convertem IDs numéricos para IDs do modelo visual, mantendo IDs numéricos nos payloads.
- ApiAuthService usa e-mail como apresentação de name. Não presume um nome retornado pelo login. Consulta /me após login para obter o vínculo que a resposta de login omite.
- Obra aceita somente PLANEJADA, EM_ANDAMENTO, CONCLUIDA e CANCELADA. INTERROMPIDA continua exclusivamente na simulação local; não é enviada como CANCELADA.
- Contar alocações não significa contar presença. WorkCard usa “alocados” quando a equipe foi retornada; FUNCIONARIO não recebe o total completo e vê informação não disponível. Presença, pendências diárias e progresso físico não são fabricados.
- Funcionário não recebe situação Pendente inventada. Status diário e dados de contrato ficam não informados. Salário é decimal em texto do início ao fim, com normalização e formatação por strings. Não há perda de centavos por Number/parseFloat. A listagem do GESTOR não recebe salário e a interface não mostra esse campo para o papel.
- Cargo é opcional, assim como datas da obra. Um endereço textual retornado pela API é exibido e editado como endereço real, sem presumir parsing para CEP/logradouro. Campos sem correspondência ficam indisponíveis no modo API.
- O schema atual não aceita null para apagar datas ou salário existentes. O formulário informa a limitação e evita confirmar um apagamento que o servidor não faria.
- criadoEm de alocação é criação do vínculo, não data de início contratual. A interface identifica a coluna como “Criado em”; não inventa retirada ou histórico de encerramento.
- Documentos/EPI usam serviços indisponíveis no modo API e exibem erro explicativo. Não leem dados locais para compor coleções ou contadores reais da Home. Ações de escrita desses módulos ficam indisponíveis, sem atribuir uma permissão de API inexistente.
- A auditoria registra nomes de campos/metadados, não valores anteriores/posteriores. O layout explicita essa ausência.

## Segurança da sessão e consistência

O cliente usa credentials:include e token CSRF em memória. Todas as mutações recebem X-CSRF-Token; 204 é tratado sem tentar ler JSON. A renovação é associada à sessão, e respostas antigas são canceladas ou rejeitadas após mudança de identidade. Não há retentativa automática de mutações.

Erros 400/401/403/404/409/413/429/500 e indisponibilidade têm mensagens seguras. 403 de CSRF é distinguido de autorização. 401 da sessão dispara limpeza e retorno ao login. Logout com falha não mostra uma saída fictícia; após confirmação limpa memória e o servidor encerra o cookie.

AuthContext continua central. Troca de usuário/papel/vínculo reinicia o DataProvider e limpa dados transitórios. Ao retomar a aba, /me verifica a sessão. SessionDataProvider bloqueia consultas protegidas antes da sessão confirmada e durante troca de senha provisória.

ScopedRecordService limita consultas no frontend: não requisita auditoria para GESTOR/FUNCIONARIO nem listagem global de funcionários para FUNCIONARIO. Sem vínculo, a conta não fabrica um cadastro. As verificações não substituem autorização do backend.

As mutações notificam os serviços existentes e invalidam coleções relacionadas. Obra renomeada, alocação alterada ou exclusão atualizam Home, listagens, detalhes e tabelas. Nenhuma relação paralela é armazenada localmente no modo API. Coleção vazia, erro e carregamento são estados distintos; consultas falhas não viram contagem zero.

Exclusões de obra, funcionário e vínculo têm diálogo explícito de irreversibilidade, cancelamento e estado de carregamento. O frontend não simula soft delete. Não é oferecida exclusão do próprio funcionário vinculado, em conformidade com o bloqueio do backend.

## Arquivos criados

- `.env.api`: configuração pública do modo API.
- `src/api/config.ts`: origem configurável e compatibilidade com alias antigo.
- `src/api/changes.ts`: notificações de invalidação entre serviços.
- `src/data/apiModels.ts`: DTOs de transporte.
- `src/data/money.ts`: normalização/formatação decimal exata.
- `src/data/ScopedRecordService.ts`: limitação de leitura/escrita por perfil.
- `src/components/shared/DeleteRecordButton.tsx`: confirmação acessível de exclusão.
- `reference/verify-http-auth.mjs`: HTTP, CSRF, sessão, logout e senha provisória.
- `reference/verify-api-crud.mjs`: CRUD com estado, precisão, escopo, exclusões e troca de identidade.
- `docs/api-compatibility.md` e este relatório.

## Arquivos modificados

- Configuração/documentação: `.env.example`, `.gitignore`, `package.json`, `README.md`.
- Infraestrutura e sessão: `src/api/ApiClient.ts`, `src/auth/ApiAuthService.ts`, `AuthContext.tsx`, `RoleRoute.tsx`, `src/App.tsx`.
- Dados: `src/data/ApiRecordServices.ts`, `models.ts`, `createDataServices.ts`, `DataContext.tsx`, `SessionDataProvider.tsx`, `summary.ts`, `AllocationService.ts`, `allocationDates.ts`, `ProfilePreferencesService.ts`.
- Usuários: `src/users/ApiUserService.ts`.
- Login/Home: `LoginForm.tsx`, `home/ProfileMenu.tsx`, `HomeHeader.tsx`, `Overview.tsx`.
- Funcionários: `EmployeeForm.tsx`, `EmployeeDetails.tsx`, `Employees.tsx`, `EmployeeTable.tsx`, `EmployeeStatus.tsx`, `InactiveEmployees.tsx`.
- Obras: `WorkForm.tsx`, `WorkDetails.tsx`, `WorkCard.tsx`, `AllocationForm.tsx`.
- Compartilhados/módulos pendentes: `shared/AddressFields.tsx`, `FlowPage.tsx`, `RecordTables.tsx`, `docs/DocumentForm.tsx`, `settings/ProfileSettings.tsx`.
- Regressão: `reference/verify-users.mjs`, ajustado para exigir renovação imediata de CSRF após login.

Nenhuma dependência nova da aplicação foi introduzida. Sidebar/Header/cards/tabelas/formulários e o mock anterior foram reutilizados; não houve redesenho geral.

## Configuração e execução

Veja o [README](../README.md). Use npm run dev:api para a origem localhost:5173; .env.api seleciona VITE_API_URL=http://localhost:3000 e os dois modos api. Configure a origem correspondente no backend sem enfraquecer cookies, CORS ou CSRF.

npm run dev mantém o mock/local explicitamente selecionado em desenvolvimento. Os registros locais e preferências exigem mock/local; não são ativados como fallback da API. Builds de produção bloqueiam mock. npm run build:api compila a integração real, com variáveis públicas fornecidas no build.

## Testes e impedimentos

Etapas foram validadas em ordem: HTTP/autenticação primeiro, usuários depois, dados administrativos em seguida. Os oito scripts de navegador foram executados:

| Verificação | Resultado / fonte |
|---|---|
| typecheck | Aprovado |
| build | Aprovado, configuração padrão sem mock de produção |
| build:api | Aprovado, configuração API em diretório separado de validação |
| test:routes | Aprovado, mock local: navegação e geometria dos assets |
| test:data | Aprovado, mock local: CRUD, persistência, erros, dados íntegros e sincronização |
| test:auth | Aprovado, mock/desabilitado/produção: sessão e proteção |
| test:flows | Aprovado, mock local: cadastros em etapas, detalhes e inativação simulada |
| test:users | Aprovado, HTTP controlado: contas, papéis, conflitos, senha e DTOs |
| test:records-api | Aprovado, HTTP controlado: adapters, rotas e permissões |
| test:http-auth | Aprovado, HTTP controlado: cookies, CSRF, estados HTTP, sessão, logout e senha provisória |
| test:api-crud | Aprovado, HTTP controlado: CRUD, confirmação/cancelamento, moeda, relações, indisponibilidade e limpeza ao trocar de identidade |

Não existe lint configurado. A suíte destrutiva do backend não foi executada. Os testes isolados não alimentam a base do navegador do usuário.

**Pendências reais:** validar criação e primeiro acesso de uma conta, demais operações de escrita e exclusões em ambiente isolado autorizado.

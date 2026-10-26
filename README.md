# Lyra Service — Frontend

Frontend de gerenciamento de obras, equipes, documentos e EPIs em React 19, TypeScript, Vite 6, Tailwind CSS 4 e React Router 7. Os componentes, ícones SVG, imagens e a identidade CleanPro do layout original do Figma foram preservados. Fontes Inter são servidas localmente por `@fontsource/inter`.

## Executar

Pré-requisitos: Node.js e npm (validado com Node.js 24.14.0 e npm 11.9.0). Não há backend nem banco de dados para instalar.

```sh
npm ci
npm run dev
```

No PowerShell com scripts desabilitados, utilize `npm.cmd`.

O servidor informa o endereço local, normalmente `http://localhost:5173`. As configurações públicas `.env.development` já habilitam a autenticação fictícia e os registros locais apenas em desenvolvimento. Para personalizar, use um arquivo `.env.development.local`, ignorado pelo Git; `.env.example` documenta as opções. Nunca coloque segredos em variáveis `VITE_*`, pois elas podem ser incluídas no código do navegador.

Conta exclusivamente demonstrativa: **admin@teste.com**, senha **Admin123!**. Não é uma credencial real; sua definição está em `src/auth/MockAuthService.ts`. Em produção o login mock é bloqueado, e as implementações reais de autenticação/dados ainda precisam ser integradas.

```sh
npm.cmd run build
npm.cmd run preview
```

`build` verifica TypeScript e gera `dist`; `preview` serve esse resultado localmente e não ativa o mock. Ao hospedar a SPA futuramente, configure fallback para `index.html` nas rotas do React Router.

## Estrutura e verificações

```text
src/auth/          Contrato de autenticação, mock, contexto e proteção de rotas
src/data/          Entidades, contratos CRUD, adapters locais e contexto de dados
src/components/    Login, Home, Obras, Funcionários, Docs, EPI e componentes compartilhados
public/assets/     Imagens e SVGs originais, armazenados localmente
reference/         Scripts de validação do navegador
```

```sh
npm run typecheck
npm run build
```

Não há configuração de lint neste projeto. As validações de navegador existentes usam Playwright instalado separadamente para não alterar as dependências da aplicação:

```sh
npm install --prefix reference/validation --no-package-lock --no-save playwright
```

No Windows, os testes usam o Edge instalado quando disponível. Em outros ambientes, instale o Chromium com `npm exec --prefix reference/validation -- playwright install chromium`, ou informe o caminho de um navegador em `PLAYWRIGHT_EXECUTABLE_PATH`.

Mantenha o servidor de desenvolvimento em `127.0.0.1:5173` com `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Com o build já gerado, execute:

```sh
npm run test:routes
npm run test:data
```

Para `npm run test:auth`, mantenha também o servidor com mock desabilitado na porta 5174 e o preview de produção na 5175. Exemplo em terminais PowerShell separados:

```powershell
$env:VITE_AUTH_MODE = 'disabled'
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

```sh
npm run preview -- --host 127.0.0.1 --port 5175 --strictPort
npm run test:auth
```

O comando de teste deve ser executado em um terceiro terminal enquanto os servidores continuam ativos. Não é necessário configurar tokens ou credenciais GitHub para executar o frontend.

Os assets originais estão em `public/assets`. A fonte Inter está instalada localmente via `@fontsource/inter`. Os componentes estão em `src/components`, e os tokens de cor em `src/styles.css`.

A referência desktop tem 1440 × 900 px. Capturas de validação, perfis de navegador e metadados temporários do Figma são arquivos locais ignorados pelo Git. O repositório inclui os scripts de teste e todos os assets utilizados pela aplicação.

Rotas com React Router: `/` redireciona para `/login`; `/login` mostra o Login; `/home` mostra a Home baseada no frame `16:4604`. O botão Entrar valida as credenciais no serviço de autenticação e navega para `/home` sem recarregar a página. Todas as rotas internas exigem sessão; quem já está autenticado é redirecionado de `/login` para `/home`.

`/obras` mostra o frame `16:4782`, acessível pela aba Obras da barra lateral e pelo cartão Obras da Home. Visão geral retorna para `/home`; a aba ativa acompanha a rota. Os componentes da listagem estão em `src/components/works`, e seus SVGs originais em `public/assets/works`. A busca permite digitar; filtros, ordenação, inclusão e detalhes aguardam seus próximos frames e não criam telas adicionais.

`/funcionarios` preserva o frame `16:4987`, acessível pela aba Funcionários e pelo cartão da Home. Os componentes estão em `src/components/employees` e os assets em `public/assets/employees`. Resumo e tabela recebem os registros do serviço local, sem dados demonstrativos iniciais.

`/docs` preserva o frame `16:5166`, acessível pela aba Docs e pelo cartão Documentos da Home. Os componentes estão em `src/components/docs`, com os assets originais em `public/assets/docs`. Os alertas, contadores e a tabela usam os registros fornecidos pelo serviço.

`/epi` preserva o frame `16:5351`, acessível pela aba EPI e pelo cartão EPIs da Home. Os componentes estão em `src/components/epi`, e os assets originais em `public/assets/epi`. Indicadores e entregas usam os registros do serviço. Os campos de busca, ações de inclusão, filtros, ordenação, detalhes e paginação mantêm sua apresentação; nenhum formulário novo foi criado.

O formulário permite editar as credenciais e alternar a visibilidade da senha. Recuperação de senha e suporte não estão conectados a serviços. Nenhum backend, autenticação real ou banco de dados foi implementado.

Os componentes da Home estão em `src/components/home`, e os SVGs originais em `public/assets/home`. A Home preserva a composição desktop do Figma; em telas estreitas, há rolagem horizontal.

A validação de navegador está em `reference/verify-routes.mjs`. Para executá-la, instale Playwright separadamente com `npm.cmd install --prefix reference/validation --no-package-lock --no-save playwright` e execute `node reference/verify-routes.mjs`. Ela usa o Edge instalado e verifica login, rotas, navegação sem recarregamento, alternância da senha, assets e erros de navegador.

## Autenticação mock

O serviço mock está em `src/auth/MockAuthService.ts`; somente esse arquivo define a conta de teste. As credenciais não ficam no componente de Login. Consulte `TEST_ACCOUNT` nesse serviço para email e senha.

`.env.development` ativa `VITE_AUTH_MODE=mock`. Para desativar, defina `VITE_AUTH_MODE=disabled` em `.env.development.local` e reinicie o Vite. A fábrica exige `import.meta.env.DEV` além do modo mock: builds de produção bloqueiam login e restauração de sessões mock, inclusive se compilados com `VITE_AUTH_MODE=mock`. O serviço mock é importado dinamicamente apenas em desenvolvimento; sua implementação e senha são excluídas do bundle de produção. O email do perfil visual fixo continua sendo exibido conforme solicitado.

`AuthService.ts` define o contrato assíncrono `login`, `logout` e `getCurrentUser`. `AuthContext.tsx` centraliza `user`, inicialização, login e logout, expostos por `useAuth()`. `ProtectedRoute.tsx` protege as páginas internas e impede que usuários autenticados permaneçam no Login. A sessão salva apenas id, nome e email em `sessionStorage`; a senha não é persistida. Sessões inválidas são descartadas.

Não existe botão de logout no Figma atual. Nenhum foi adicionado. A função `useAuth().logout()` limpa a sessão, atualiza o contexto e provoca o redirecionamento das rotas protegidas para `/login`.

Para autenticação real, implemente `ApiAuthService` conforme `AuthService` e retorne esse adapter em `createAuthService.ts`. Login, contexto e proteções usam somente o contrato e não precisam mudar. O provider também aceita `service` para injeção em testes. Não há implementação de API nesta etapa.

Para testar os seis cenários de autenticação, mantenha o servidor mock na porta 5173, inicie um Vite com `VITE_AUTH_MODE=disabled` na porta 5174, compile a aplicação e inicie `npm.cmd run preview -- --host 127.0.0.1 --port 5175 --strictPort`. Execute `node reference/verify-auth.mjs`. O teste verifica credenciais corretas/incorretas, Enter, loading, rotas protegidas, recarga, logout via contexto, sessões inválidas, modo desativado e produção; o fixture de logout é gerado apenas na pasta de validação ignorada pelo Git.

## Registros locais e integração futura

As entidades identificadas são `Work`, `Employee`, `DocumentRecord` e `EquipmentItem`, tipadas em `src/data/models.ts`. Os exemplos do Figma foram removidos dos componentes e não são carregados como seeds. As quatro coleções começam com `[]` somente quando suas chaves ainda não existem; registros existentes e válidos são preservados.

- `src/data/WorkService.ts`: contrato CRUD assíncrono para obras, baseado em `RecordService` (`getAll`, `getById`, `create`, `update`, `delete` e assinatura opcional de alterações).
- `src/data/MockWorkService.ts`: implementação local para obras. Reutiliza `LocalRecordService`, também usado nas outras entidades. Novos registros recebem UUID por `crypto.randomUUID()`; editar mantém o identificador.
- `src/data/createDataServices.ts`: único ponto que escolhe os adapters. Exige desenvolvimento e `VITE_DATA_MODE=local`, configurado em `.env.development`. Produção não utiliza nem inclui a implementação local no bundle; até existir um backend, o serviço de produção informa indisponibilidade.
- `src/data/DataContext.tsx`: entrega coleções, estado de consulta e `refresh()` aos componentes. Alterações pelo serviço notificam a mesma aba; eventos de `storage` atualizam outras abas. A seleção do cabeçalho e o acompanhamento mostram a primeira obra disponível.
- `src/components/shared/CollectionState.tsx`: estados separados de carregamento, erro com tentativa novamente e ausência de registros.

Chaves de `localStorage`: `cleanpro.works`, `cleanpro.employees`, `cleanpro.documents`, `cleanpro.equipment`. O serviço valida JSON, campos, limites de progresso e IDs duplicados. Dados inválidos são mantidos no armazenamento e apresentados como erro; não são substituídos silenciosamente por listas vazias. Falhas de acesso ou gravação também são reportadas. Não utilize esse armazenamento para senhas, tokens, documentos anexos ou informações sensíveis. A sessão do login continua separada em `sessionStorage` e seu funcionamento não foi alterado.

`WorkCard` mantém dimensões, ícones, cores e estrutura e recebe `work: Work`. A Home e Obras renderizam um card por registro, com `key={work.id}`. `progress` define a barra em porcentagem; `barWidth` foi removido do modelo. Somente `id` e `name` são obrigatórios em obras. Localização, responsável, progresso, trabalhadores, `attention`, `active` e `inspectionDate` são opcionais; sua ausência aparece como não informada e não gera valores de negócio fictícios.

Contadores de registros e status são derivados das coleções. Média física só aparece com progresso informado em todas as obras. Ativas e vistorias só são contadas quando os respectivos campos foram informados em todos os registros; a data da vistoria usa `AAAA-MM-DD`. Trocas/estoque baixo usam os indicadores fornecidos pelos registros, sem deduzir regras pela condição textual do item. Conformidade permanece `—`, pois ainda não há regra nem dados que permitam calculá-la. Os quatro cards de navegação da Home continuam existindo como atalhos reais, não como registros demonstrativos. Organização e perfil visual fixo permanecem conforme as solicitações anteriores.

Para conectar o backend, implemente `ApiWorkService implements WorkService` e retorne esse adapter na fábrica `createDataServices.ts`. Faça o mesmo com os contratos tipados das demais entidades quando houver endpoints reais. Um adapter pode emitir `subscribe` após mutações para manter as telas atualizadas, ou a integração pode usar `refresh()` do contexto. `Home`, `Works`, `WorkCard` e as linhas das tabelas não precisam conhecer HTTP nem `localStorage`. Também é possível injetar `DataServices` em `DataProvider` para testes. Não foram implementados endpoints ou requisições HTTP.

### Verificação de dados

Com o Vite de desenvolvimento na porta 5173 e o build atualizado:

```sh
node reference/verify-data.mjs
node reference/verify-routes.mjs
```

O teste de dados usa contexto de navegador isolado, nunca preenche o armazenamento do navegador do usuário. Valida coleções vazias, CRUD, UUIDs, dados inválidos preservados, recarga, reabertura da página, alterações na mesma aba e entre abas, cards/progresso dinâmicos, tabelas, estados assíncronos e exclusão do mock de produção. Entradas sintéticas existem apenas no teste e não são dados iniciais da aplicação.

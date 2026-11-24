# Implementação das telas restantes — Lyra Service

Referência de design: PI 2 — Refatoração, Desktop. Inventário obtido por metadata; contextos de design e screenshots dos 17 frames revisados foram consultados. Não há outra página no arquivo nem modais independentes entre os 23 frames principais. As etapas são estados do mesmo formulário, não páginas duplicadas.

## Inventário completo

| Frame | Tela | Situação | Rota / estado |
|---|---|---|---|
| 16:4544 | Login desktop | Existente, preservado | `/login` |
| 16:4604 | Visão geral desktop | Existente, preservado | `/home` |
| 16:4782 | Obras desktop | Existente; ações conectadas | `/obras` |
| 16:4987 | Funcionários desktop | Existente; ações conectadas | `/funcionarios` |
| 16:5166 | Documentos desktop | Existente; ações conectadas | `/docs` |
| 16:5351 | Configurações — Usuários | Listagem existente; busca, filtros, paginação e apresentação ajustados | `/configuracoes/usuarios`, aba Usuários |
| 2004:35285 | Configurações — Adicionar usuário e permissões | Existente; abas conectadas | `/configuracoes/usuarios`, formulário inicial |
| 2004:33251 | Adicionar funcionário — Dados pessoais | Implementado | `/funcionarios/novo`, etapa 1 |
| 2004:33393 | Adicionar funcionário — Contrato | Implementado | Mesma rota, etapa 2 |
| 2004:33518 | Adicionar funcionário — Documentos e obras | Implementado | Mesma rota, etapa 3 |
| 2004:33698 | Funcionário — Resumo | Implementado | `/funcionarios/:id` ou `/funcionarios/:id/resumo` |
| 2004:33850 | Funcionário — Documentos | Implementado | `/funcionarios/:id/documentos` |
| 2004:34026 | Funcionário — Obras | Implementado | `/funcionarios/:id/obras` |
| 2004:34182 | Adicionar obra — Dados gerais | Implementado | `/obras/nova`, etapa 1 |
| 2004:34305 | Adicionar obra — Endereço e responsáveis | Implementado | Mesma rota, etapa 2 |
| 2004:34445 | Obra — Detalhes | Implementado | `/obras/:id` |
| 2004:34619 | Funcionários — Inativos | Implementado | `/funcionarios/inativos` |
| 2004:34777 | Obras — Inativas | Implementado | `/obras/inativas` |
| 2004:34906 | Alocar funcionário em obra | Implementado | `/alocacoes/nova?obra=:id&funcionario=:id` — parâmetros opcionais |
| 2004:35030 | Adicionar documento — Dados do documento | Implementado | `/docs/novo`, etapa 1 |
| 2004:35163 | Adicionar documento — Arquivo | Implementado | Mesma rota, etapa 2 |
| 2004:35510 | Configurações — Histórico de alterações | Implementado | `/configuracoes/historico` |
| 2004:35688 | Configurações — Meu perfil | Implementado | `/configuracoes/perfil` |

Nenhum frame principal foi omitido. Algumas operações e campos não têm persistência na API; as limitações estão discriminadas abaixo. A tela EPI existente foi preservada em `/epi`; o frame `16:5351` do arquivo antigo era EPI, mas neste arquivo de refatoração corresponde a Usuários.

Também foram conectadas `/obras/:id/editar`, `/funcionarios/:id/editar` e `/funcionarios/:id/historico`, reutilizando os formulários e a tabela de auditoria. Documentos de uma obra são consultados em `/obras/:id?aba=documentos`; o histórico administrativo usa `?aba=historico`.

## Componentes e navegação

Sidebar, HomeHeader, PageHeading, ProfileMenu, WorkCard, EmployeeRow, DocumentRow, CollectionState, AddUserForm, UserList e a arquitetura AuthProvider/ProtectedRoute/AdminRoute foram reutilizados. Login, Home e EPI não foram redesenhados. A ordem e os links da Sidebar existente, incluindo EPI, foram preservados.

Foram criados `FlowPage`, `Panel`, `Steps`, `Field`, `SelectField`, `Actions`, `Info`, `Message`, `Value`, `Pagination`, `AddressFields`, `FlowIcon`, `RecordTables` e utilitário de iniciais. A seleção de obras e as regras de documentos são compartilhadas pelos dois cadastros. Os novos SVGs foram baixados do Figma para `public/assets/flows`; nenhum screenshot é utilizado como interface. Os estilos novos ficam em `src/styles/flows.css`, com escopo nas telas novas.

Adicionar obra/funcionário/documento parte das listagens. Ver obra e as opções de funcionário abrem detalhes; os detalhes permitem edição, consulta de documentos e alocações. Os formulários possuem avanço, retorno, cancelamento, validação, carregamento, erro e confirmação. O nome no painel de perfil leva a Meu perfil. As abas Perfil/Usuários/Histórico funcionam sem recarregar a página.

Há busca, filtros e ordenação nas listagens relacionadas aos fluxos novos, paginação nas tabelas, filtros de período e seleção de detalhe no histórico. Ações antigas de EPI, suporte, notificações gerais e inclusão genérica da Home continuam com o escopo anterior: este arquivo não fornece fluxos adicionais para elas.

## Serviços e persistência

`DataContext` continua sendo a fonte compartilhada. O contrato `RecordService<T>` e os serviços locais existentes foram estendidos; não há segunda base de registros. As coleções iniciam vazias e não recebem exemplos do Figma. IDs locais usam UUID. O serviço preserva dados válidos existentes e informa corrupção/erro sem apagar o armazenamento. Estados de carregamento, vazio, erro e dados disponíveis continuam distintos.

- `createDataServices`: seleciona adapters por ambiente.
- `LocalRecordService`/`MockWorkService`: persistência local de desenvolvimento.
- `TransientFieldsService`: campos pessoais apenas em memória; não serializa CPF, nascimento, telefone, endereço residencial, foto, e-mail de funcionário ou contatos pessoais de responsáveis. Observações de documentos também ficam em memória.
- `attachments`: arquivos em memória; valida PDF/JPG/PNG até 10 MB e fotos JPG/PNG até 5 MB. Não grava arquivos no localStorage.
- `AuditedRecordService`: registra eventos reais de operações locais, apenas com ação, entidade, ID e data. Não cria eventos demonstrativos nem snapshots de informações pessoais. Se a auditoria local falhar, a aplicação informa que o registro principal já foi salvo.
- `AllocationService`: valida entidades, duplicidade e inatividade; preserva outras alocações e explicita salvamento parcial em lotes. Datas permitem simular vínculos programados, atuais e encerrados.
- `documentRules`: validade por tipo — ASO 12 meses; Ordem de Serviço/NR-06/NR-18 24 meses; Ficha de EPI 3 meses — incluindo ajuste do último dia do mês.
- `ProfilePreferencesService`: salva somente preferências não sensíveis em desenvolvimento. Não envia notificações reais.
- `ApiRecordService`, `ApiAuditService`, `ApiUserService` e `ApiAuthService`: adapters reais com o ApiClient existente, sessão por cookie e CSRF em memória.

Metadados não sensíveis, registros básicos, contratos simulados, vínculos e preferências locais sobrevivem à recarga. Dados pessoais e anexos em memória se perdem na recarga; campos indisponíveis aparecem como não informados. Logout/expiração também limpa as informações transitórias. Esta é uma limitação deliberada para cumprir a proibição de persistir dados sensíveis em localStorage, enquanto o backend não os suporta.

O cadastro composto de funcionário guarda o ID principal e os documentos já salvos durante tentativas parciais, evitando recriar o mesmo funcionário ao tentar novamente. Alocações já existentes são preservadas. Uma recarga reinicia os rascunhos dos formulários na primeira etapa, sem persistir rascunhos pessoais.

## Contratos reais e configuração

Foram consultados README, Prisma, schemas, controllers e rotas de autenticação, usuários, obras, funcionários, alocações e auditoria no [backend](https://github.com/univesp-projeto-integrador-pi/gerenciamento-lyra-service). Nenhuma alteração foi feita nesse repositório.

| Recurso | Operações dos adapters | Dados enviados |
|---|---|---|
| Obras | GET coleção/detalhe, POST, PUT, DELETE `/api/obras[/:id]` | `nome`, `endereco?`, `status?`, `dataInicio?`, `dataFim?` |
| Funcionários | GET coleção/detalhe, POST, PUT, DELETE `/api/funcionarios[/:id]` | `nome`, `email`, `cargo?`; atualização parcial |
| Alocações | GET coleção/detalhe, POST, PUT, DELETE `/api/alocacoes[/:id]` | `funcionarioId`, `obraId`, numéricos |
| Auditoria | GET `/api/auditoria?limite=200` | Somente consulta; filtros de tela aplicados ao conjunto retornado |
| Usuários/autenticação | Contratos existentes mantidos | Sem alteração dos DTOs anteriores |

Os adapters possuem DELETE porque faz parte do contrato existente; não foram adicionados botões de exclusão de entidades que não aparecem nos frames. DELETE físico não foi utilizado para simular inativação. O campo salário da API não foi adicionado ao formulário porque não aparece no Figma nem é necessário ao cadastro.

Para usar uma instância real, configure `.env.development.local` e reinicie:

```dotenv
VITE_AUTH_MODE=api
VITE_DATA_MODE=api
VITE_API_BASE_URL=http://localhost:3000
```

Configure a origem exata do frontend no backend, cookies, CORS e uma conta válida. Em produção, as variáveis devem ser fornecidas no build. Mock/local só funcionam com `import.meta.env.DEV`; produção não ativa autenticação simulada. `SessionDataProvider` impede consultas protegidas antes do login ou da troca obrigatória de senha. Os testes de API usam interceptação HTTP isolada; não foi testada uma instância real nem criado qualquer registro remoto.

## Permissões

ProtectedRoute e o fluxo de senha provisória permanecem. RoleRoute/AdminRoute complementam a proteção:

- ADMIN: usuários, auditoria, funcionários, obras e alocações.
- GESTOR: consulta funcionários; cria/edita obras e alocações; sem acesso a cadastro/edição de funcionários, usuários ou auditoria.
- FUNCIONARIO: consulta o próprio cadastro; obras e alocações sujeitas ao escopo do servidor; sem rotas de criação/edição administrativa. EmployeeAccessRoute verifica o vínculo do usuário antes de consultar outro funcionário.
- Perfil é pessoal; somente ADMIN vê as abas administrativas. O item Funcionários leva ao próprio cadastro para FUNCIONARIO vinculado.

Botões de escrita acompanham esses papéis. A autorização definitiva e o escopo das obras pertencem ao backend. Documentos não têm política de API definida; a escrita mock disponível para ADMIN/GESTOR é uma simulação de desenvolvimento, não uma nova permissão enviada ao servidor.

## Diferenças do Figma e dependências pendentes

1. **Funcionários:** a API exige e-mail, ausente no frame; o campo aparece no modo API. CPF, nascimento, celular, endereço, foto, admissão, registro, jornada, situação e demissão não têm campos equivalentes. Campos pessoais ficam transitórios e os contratuais são simulados no modo local. A API nunca recebe propriedades desconhecidas. O vínculo Usuario–Funcionario continua opcional e separado.
2. **Obras:** apelido, CBO, empresa, múltiplos endereços estruturados, responsáveis/contatos, progresso, data e justificativa de inativação não são persistidos pela API. O endereço principal é convertido para `endereco` (até 200 caracteres). A API tem `CANCELADA`, não `INTERROMPIDA`: a UI do modo API mostra Cancelada; Interrompida fica exclusivamente na simulação local, sem presumir equivalência entre os estados. Não foi usado DELETE para encerrar obras.
3. **Documentos:** não existem endpoints de cadastro, upload, renovação ou consulta. O fluxo completo funciona em desenvolvimento local; metadados persistem, arquivos e observações ficam em memória. Uma renovação acrescenta um registro e preserva o anterior. A indicação de documentação válida não é inventada quando não existem documentos consultáveis. No modo API a tela informa a indisponibilidade, sem simular sucesso.
4. **Alocações:** a API aceita apenas IDs, registra `criadoEm` e não possui datas de inclusão/retirada ou histórico de encerramento. Esses campos são desabilitados no modo API; o serviço não os envia. O lote é sequencial porque não existe endpoint de lote; um erro informa quantos itens já foram salvos.
5. **Perfil:** identidade vem da autenticação e fica somente leitura; não existe endpoint de edição de nome/e-mail ou preferências. A troca de senha usa o endpoint real quando configurado, com 10–128 caracteres (o Figma sugere 8). O mock não altera o par sintético configurado localmente. Preferências não significam envio real de e-mails.
6. **Auditoria:** a API registra metadados/nomes de campos, não snapshots com valores anteriores e posteriores. Os painéis Antes/Depois explicitam a ausência desses valores; os detalhes disponíveis são mostrados sem expor senhas/tokens. Nome do autor não é retornado: utiliza-se o ID existente, sem inventar nomes. O período filtra somente os últimos 200 eventos consultados, não todo o histórico remoto.
7. **Usuários:** mantidos ADMIN/GESTOR/FUNCIONARIO, senha temporária e permissões fixas do backend, em lugar de Editor/Visualizador e convites por e-mail do desenho. Sem registros fictícios ou confirmação falsa de convite.
8. **Layout:** somente há referências desktop; foi preservada a largura mínima e a rolagem horizontal existentes. Não foram inventados layouts móveis, telas ou modais adicionais.

## Validação

Scripts: `typecheck`, `build`, `test:routes`, `test:data`, `test:auth`, `test:users`, `test:flows` e `test:records-api`. Não existe configuração de lint no projeto.

Resultado final: os oito comandos acima passaram. O build de produção compilou 113 módulos sem erros. As seis suítes de navegador terminaram sem erros JavaScript. Os testes de API verificaram contratos por interceptação HTTP, não contra uma instância remota.

Os testes existentes cobrem login, sessão, navegação, assets, coleções vazias, CRUD/persistência, integridade dos dados, sincronização entre abas, erros, produção sem mock e gerenciamento de usuários. Os novos testes cobrem rotas novas, cadastros em etapas, edição/inativação, preservação de documentos, alocações, validade/anexo, detalhes do histórico, preferências, payloads exatos da API, CSRF, erros 403, papéis e acesso ao próprio funcionário. Usam contextos isolados e não preenchem a base do navegador do usuário.

Capturas de navegador foram comparadas às referências do Figma. Diferenças de conteúdo refletem dados cadastrados apenas no teste e estados vazios reais; os exemplos do Figma não foram copiados para o aplicativo. Capturas e downloads temporários ficam em `reference/validation`, ignorados pelo Git.

Nenhum commit, push, Pull Request ou alteração de backend foi realizado nesta tarefa.

# Auditoria de compatibilidade — integração real
Auditoria dos contratos da API Express e dos campos exibidos pelo frontend, realizada em 09/11/2026.

| Entidade | Disponível diretamente | Derivado legítimo | Ausente / limitação |
|---|---|---|---|
| Sessão | id, email, papel, funcionarioId, precisaTrocarSenha | Identificação visual pelo e-mail | Nome não retornado pelo auth; não presumir Administrador |
| Usuário | email, papel, ativo, senha provisória, funcionário opcional | Nome do funcionário vinculado, quando retornado | Convites, exclusão, permissões personalizadas |
| Obra | nome, endereco, status, dataInicio, dataFim | Número de alocados quando a equipe completa é visível | Progresso físico, presença, responsáveis, CBO, empresa, múltiplos endereços, justificativa e data de inativação |
| Funcionário | nome, email, cargo, salario decimal em texto; salários ocultos de GESTOR | Obras retornadas nos vínculos | CPF, presença/status diário, foto, contrato, datas de admissão/demissão, endereço pessoal |
| Alocação | funcionarioId, obraId, criadoEm, relações selecionadas | Nome/cargo/obra retornados; criadoEm é criação, não início contratual | Agendamento, retirada, motivo e histórico de encerramento |
| Auditoria | ação, autor por ID, recurso, ID, detalhes e data | Metadados seguros | Snapshots antes/depois; nome do autor não garantido |
| Documentos / EPI | Nenhum endpoint | Nenhum indicador real | Cadastro, consulta, upload, validade, estoque e entrega pendentes |
| Perfil | Sessão e troca de senha | Identificação pelo e-mail | Atualizar nome, e-mail e preferências, envio de notificações |

Rotas, controllers, schemas, middlewares, sessão/CSRF, Prisma e README locais foram examinados. O backend mantém DELETE físico de obras/funcionários/alocações; não existe DELETE de usuários. FUNCIONARIO não pode listar funcionários nem ver equipe completa de obras. GESTOR não administra funcionários/usuários nem consulta auditoria.

O [diagnóstico de consistência](integration-consistency.md) reúne os resultados posteriores de HTTP real e persistência.

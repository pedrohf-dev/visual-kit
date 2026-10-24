# Validação da implementação

Executada em 24/10/2026.

| Verificação | Resultado |
| --- | --- |
| TypeScript (`npm run check`) | Passou |
| Testes automatizados (`npm test`) | 25 passaram |
| Build de produção (`npm run build`) | Passou |
| Auditoria de dependências após atualização | 0 vulnerabilidades reportadas |

Cobertura automatizada: sintaxes wiki/Markdown e dimensões; preservação de código e embeds especiais; nomes e pastas; SHA-256; histórico; validação de sidecars; colagem de quatro imagens em ordem; deduplicação entre colagens e dentro do lote; nomes únicos no modo Always save; falha parcial; revalidação de índice; proteção contra sobrescrita de edições durante paste; exportação PNG com recorte e zoom; pixels opacos da tarja; reabertura e undo/redo de objetos; exportação HTML com imagens embutidas e normalização sem alteração do Markdown.

Os testes usam adaptadores simulados para Vault, Editor, MarkdownRenderer e Electron clipboard. O teste de rasterização usa Fabric.js com canvas real em Node. Eles não substituem a validação da interface nem do clipboard no Obsidian Desktop.

Pendente de teste manual: integração real dos eventos de paste/copy e menus no Obsidian, diferentes sistemas operacionais e aceitação do HTML com imagens no Movidesk/Outlook/outros destinos. Veja o roteiro no README.

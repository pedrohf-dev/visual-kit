# Obsidian QA Rich Copy — Specification v2.2

## 1. Visão do produto

Obsidian QA Rich Copy é um plugin desktop para Obsidian focado em profissionais que trabalham com:

- análise de qualidade;
- suporte;
- documentação;
- reporte de bugs;
- evidências;
- testes;
- tickets.

O plugin deve fornecer um fluxo integrado para:

1. trabalhar com screenshots;
2. colar uma ou várias imagens de uma vez;
3. detectar imagens duplicadas;
4. anotar imagens;
5. redimensionar imagens;
6. padronizar o tamanho das imagens de uma nota;
7. escrever documentação ao redor delas;
8. copiar texto + imagens;
9. colar tudo diretamente no Movidesk ou outro editor rich-text.

O objetivo principal é eliminar ferramentas externas durante a criação de evidências.

Fluxo ideal:

```text
Screenshot(s)
    ↓
Colar no Obsidian
    ↓
Detectar duplicatas
    ↓
Salvar e inserir automaticamente
    ↓
Anotar
    ↓
Adicionar seta / retângulo / texto
    ↓
Padronizar tamanho das imagens
    ↓
Escrever explicação
    ↓
Selecionar tudo
    ↓
Copy with Images
    ↓
Movidesk
```

---

# 2. Problemas resolvidos

O plugin resolve cinco problemas relacionados.

## Problema A — Clipboard

Ao copiar conteúdo do Obsidian contendo:

```md
![[imagem.png]]
```

o destino pode receber apenas Markdown em vez da imagem real.

O plugin deve copiar texto formatado e imagens reais usando rich clipboard.

## Problema B — Anotação de evidências

Durante análise de qualidade é comum precisar:

- apontar um botão;
- destacar uma área;
- desenhar um retângulo;
- inserir uma seta;
- numerar passos;
- escrever observações;
- ocultar dados sensíveis.

O plugin deve permitir realizar essas operações sem sair do Obsidian.

## Problema C — Padronização visual

Notas contendo vários screenshots frequentemente ficam com tamanhos diferentes.

O plugin deve permitir transformar rapidamente todas as imagens da nota para o mesmo tamanho visual.

## Problema D — Colagem de várias evidências

Durante testes, o usuário pode possuir várias imagens no clipboard ou copiar vários arquivos de uma vez.

O Obsidian QA Rich Copy deve permitir inserir todas em uma única operação.

## Problema E — Imagens duplicadas

É comum copiar acidentalmente o mesmo screenshot mais de uma vez.

O plugin deve detectar conteúdo de imagem duplicado e evitar criar arquivos redundantes quando possível.

---

# 3. Público-alvo

Principalmente:

- QA Analysts;
- Software Testers;
- suporte técnico;
- analistas de atendimento;
- desenvolvedores;
- documentação técnica.

O produto não deve ser limitado especificamente a QA.

---

# 4. Plataforma

MVP:

- Obsidian Desktop;
- Windows como plataforma prioritária;
- macOS;
- Linux.

Mobile não faz parte do escopo inicial.

---

# 5. Privacidade

Todo processamento deve acontecer localmente.

Não utilizar:

- servidores externos;
- APIs de upload;
- serviços de edição remota;
- cloud processing.

Screenshots podem conter informações internas ou confidenciais.

---

# 6. Workflow principal

O usuário deve poder:

1. copiar uma ou várias imagens;
2. colar no Obsidian;
3. deixar o plugin salvar os arquivos automaticamente;
4. detectar duplicatas;
5. inserir todos os embeds;
6. abrir uma imagem em `Annotate`;
7. adicionar retângulo;
8. adicionar seta;
9. adicionar texto;
10. salvar;
11. normalizar tamanhos;
12. selecionar o conteúdo;
13. executar `Copy with Images`;
14. colar no Movidesk.

---

# 7. Editor de imagens

Adicionar um editor integrado de imagens.

Comando:

**QA Rich Copy: Annotate image**

Disponível através de:

- Command Palette;
- botão/context menu da imagem;
- menu de contexto do File Explorer;
- hotkey configurável.

---

# 8. Ferramentas obrigatórias do editor

## Selection Tool

Permite:

- selecionar objeto;
- mover;
- redimensionar;
- alterar propriedades;
- excluir.

Atalho sugerido:

`V`

## Arrow

Propriedades:

- cor;
- espessura;
- tamanho da ponta;
- opacidade.

Atalho:

`A`

## Rectangle

Opções:

- apenas borda;
- preenchimento;
- preenchimento transparente;
- espessura;
- cor;
- opacidade;
- cantos arredondados opcionalmente.

Atalho:

`R`

## Ellipse

Atalho:

`E`

## Text

Suportar:

- múltiplas linhas;
- tamanho;
- cor;
- background;
- bold;
- alinhamento.

Atalho:

`T`

## Freehand

Atalho:

`D`

Propriedades:

- espessura;
- cor;
- opacidade.

---

# 9. Ferramentas específicas para QA

## Number Marker

Criar marcadores numerados automaticamente.

Exemplo:

```text
1
2
3
4
```

## Highlight

Criar área semitransparente para chamar atenção para uma região.

## Redaction

Ferramenta para esconder informações sensíveis.

Exemplos:

- nome;
- CPF;
- email;
- telefone;
- token;
- endereço;
- informações internas.

Modo inicial:

- retângulo sólido.

Futuro:

- blur;
- pixelate.

---

# 10. Crop

Permitir crop antes ou depois de adicionar anotações.

---

# 11. Undo / Redo

Obrigatório.

Atalhos:

```text
Ctrl+Z
Ctrl+Shift+Z
```

ou:

```text
Ctrl+Y
```

---

# 12. Zoom e navegação

Suportar:

```text
Ctrl + Wheel → zoom
Wheel → scroll
Space + Drag → pan
```

Adicionar:

- Fit image;
- 100%;
- Zoom in;
- Zoom out.

---

# 13. Cores rápidas

Paleta padrão:

- vermelho;
- amarelo;
- verde;
- azul;
- branco;
- preto.

O plugin deve lembrar a última cor utilizada.

---

# 14. Presets de QA

Presets iniciais:

### Error

Vermelho.

### Attention

Amarelo.

### Success

Verde.

### Info

Azul.

---

# 15. Salvamento

## Save as new image

Default recomendado.

```text
login.png
→
login-annotated.png
```

## Replace original

Sobrescrever original mediante confirmação.

## Save copy

Permitir nome personalizado.

---

# 16. Edição não destrutiva

Preferencialmente armazenar dados editáveis separadamente:

```text
login-annotated.png
login-annotated.qrc.json
```

---

# 17. Flatten

Adicionar operação:

**Flatten image**

Transforma as anotações em pixels definitivos.

---

# 18. Atualização automática do embed

Após salvar como nova imagem:

```text
Replace
Keep original
Insert annotated below
```

---

# 19. Quick Annotate

Menu de contexto:

```text
Annotate
Copy image
Copy image with annotations
Open image
Resize
Normalize note images
```

---

# 20. Copy Annotated Image

Dentro do editor:

**Copy**

Deve renderizar imagem + anotações e colocar o resultado no clipboard.

---

# 21. Save + Copy

Ação:

**Save & Copy**

Fluxo:

```text
render
→ save
→ clipboard
```

---

# 22. Copy with Images

Transformar:

```md
Texto

![[evidence.png|500]]

Texto
```

em clipboard contendo:

```text
text/plain
text/html
```

com imagem real embutida.

---

# 23. Resize do Obsidian

Respeitar:

```md
![[image.png|500]]
```

e:

```md
![[image.png|500x300]]
```

---

# 24. Normalize Image Sizes

Adicionar comando:

**QA Rich Copy: Normalize image sizes**

Exemplo:

```md
![[login.png|820]]
![[erro.png]]
![[dashboard.png|450]]
```

Com largura escolhida:

```text
600px
```

Resultado:

```md
![[login.png|600]]
![[erro.png|600]]
![[dashboard.png|600]]
```

Essa operação deve alterar apenas o tamanho visual definido no Markdown.

---

# 25. Normalize — interface

Modal:

```text
Normalize image sizes

Width:
[ 600 ] px

Scope:
(o) Current note
( ) Current selection

[ Cancel ] [ Apply ]
```

---

# 26. Normalize — hotkey rápido

Comando:

**Normalize images using default width**

Configuração:

```text
Default image width: 600px
```

Hotkey sugerido:

```text
Ctrl+Alt+I
```

---

# 27. Normalize — botão

Adicionar opcionalmente botão na ribbon:

**Normalize image sizes**

---

# 28. Normalize — comportamento

Suportar:

```md
![[image.png]]
![[image.png|400]]
![[image.png|400x300]]
![](image.png)
```

Default:

- aplicar largura;
- preservar aspect ratio;
- remover altura explícita salvo configuração contrária.

---

# 29. Normalize — escopo

Suportar:

- Current note;
- Current selection.

Futuro:

- Current section.

---

# 30. Normalize — undo

`Ctrl+Z` deve desfazer toda a normalização em uma única operação.

---

# 31. Normalize — imagens especiais

Não alterar:

- PDF;
- áudio;
- vídeo;
- Canvas;
- notas embedadas.

---

# 32. Normalize — configurações

```text
Default normalized width: 600
Preserve explicit height: OFF
Normalize on Copy for Ticket: OFF
```

Presets:

```text
Small 400px
Medium 600px
Large 800px
Original
```

---

# 33. Normalize on Copy for Ticket

Opcionalmente normalizar somente o HTML exportado, sem alterar o Markdown original.

---

# 34. Colar várias imagens de uma vez

Adicionar suporte a múltiplas imagens em uma única operação de paste.

O plugin deve reconhecer quando o clipboard contém:

- várias imagens;
- vários arquivos de imagem;
- uma combinação compatível de arquivos/imagens.

Exemplo:

```text
imagem1.png
imagem2.png
imagem3.png
imagem4.png
```

Ao colar:

```text
Ctrl+V
```

o plugin deve salvar e inserir todas.

Resultado:

```md
![[imagem1.png]]

![[imagem2.png]]

![[imagem3.png]]

![[imagem4.png]]
```

A ordem original deve ser preservada.

---

# 35. Multi-image Paste — comportamento

O fluxo deve ser:

```text
Clipboard
↓
Enumerate image items
↓
Validate formats
↓
Check duplicates
↓
Generate filenames
↓
Save files
↓
Insert embeds
```

As imagens devem ser processadas em lote.

---

# 36. Multi-image Paste — tamanho automático

Adicionar configuração:

**Apply default width to pasted images**

Exemplo:

```text
Default width: 600px
```

Quando ativado:

```md
![[imagem1.png|600]]

![[imagem2.png|600]]

![[imagem3.png|600]]
```

Default:

`OFF`

---

# 37. Multi-image Paste — espaçamento

Configuração:

**Insert blank line between pasted images**

Default:

`ON`

Resultado:

```md
![[imagem1.png]]

![[imagem2.png]]

![[imagem3.png]]
```

Em vez de:

```md
![[imagem1.png]]
![[imagem2.png]]
![[imagem3.png]]
```

---

# 38. Multi-image Paste — naming

Permitir template:

```text
{note}-{date}-{counter}
```

Exemplo:

```text
ticket-1423-2026-10-24-01.png
ticket-1423-2026-10-24-02.png
ticket-1423-2026-10-24-03.png
```

O contador deve garantir nomes únicos.

---

# 39. Multi-image Paste — progresso

Para muitas imagens, exibir feedback:

```text
Saving images: 4/12
```

Não bloquear desnecessariamente a interface do Obsidian.

---

# 40. Multi-image Paste — falha parcial

Se uma imagem falhar:

```text
3 images pasted successfully.
1 image failed.
```

O erro deve indicar qual item falhou.

Não descartar imagens já salvas com sucesso.

---

# 41. Paste & Annotate em lote

Adicionar futuramente:

**Paste images and annotate**

Fluxo:

```text
colar 4 imagens
↓
salvar todas
↓
abrir primeira no editor
↓
Save & Next
↓
segunda
↓
Save & Next
↓
...
```

Isso permite revisar rapidamente uma sequência de evidências.

---

# 42. Detecção de duplicatas

Adicionar sistema de detecção de imagens duplicadas.

O objetivo é impedir arquivos como:

```text
erro.png
erro-1.png
erro-2.png
erro-3.png
```

quando todas possuem exatamente o mesmo conteúdo.

---

# 43. Duplicatas — hash

Calcular um hash do conteúdo binário da imagem.

Sugestão:

```text
SHA-256
```

Exemplo:

```text
imagem A → hash abc123...
imagem B → hash abc123...
```

Se os hashes forem iguais:

```text
duplicate = true
```

Não confiar apenas em:

- nome;
- tamanho;
- data;
- resolução.

A comparação deve ser baseada no conteúdo.

---

# 44. Duplicatas — comportamento padrão

Quando uma imagem idêntica já existir no Vault:

```text
Duplicate image detected
```

Default recomendado:

**Reuse existing image**

Ou seja, não criar novo arquivo.

Apenas inserir referência para o arquivo existente.

Exemplo:

Arquivo já existente:

```text
attachments/login-error.png
```

Novo paste idêntico:

```md
![[attachments/login-error.png]]
```

Nenhuma cópia adicional deve ser criada.

---

# 45. Duplicatas — opções

Configuração:

**When duplicate image is detected**

Opções:

### Reuse existing

Default.

### Ask

Mostrar:

```text
This image already exists:

attachments/login-error.png

[ Reuse ]
[ Save duplicate ]
[ Cancel ]
```

### Always save

Comportamento tradicional.

---

# 46. Duplicatas — múltiplos matches

Se o mesmo conteúdo existir em vários locais:

```text
attachments/a.png
ticket-1/a.png
archive/a.png
```

Preferir:

1. imagem na pasta de attachments configurada;
2. imagem associada à nota atual;
3. imagem mais próxima da nota;
4. primeira correspondência válida.

No modo `Ask`, mostrar opções ao usuário.

---

# 47. Duplicatas — index local

Para evitar recalcular todos os arquivos a cada paste, manter um índice local.

Exemplo conceitual:

```json
{
  "sha256:abc123": "attachments/login.png",
  "sha256:def456": "attachments/dashboard.png"
}
```

Esse índice deve ser recriável.

Não deve ser fonte exclusiva da verdade.

Se necessário, validar se o arquivo ainda existe.

---

# 48. Duplicatas — atualização do índice

Atualizar índice quando:

- imagem é adicionada;
- imagem é removida;
- imagem é renomeada;
- imagem é modificada.

Também disponibilizar comando:

**QA Rich Copy: Rebuild image duplicate index**

---

# 49. Duplicatas — imagem modificada

Se uma imagem for anotada ou editada:

```text
original hash ≠ edited hash
```

ela deve ser considerada uma imagem diferente.

Exemplo:

```text
login.png
login-annotated.png
```

não são duplicatas mesmo que derivem da mesma fonte.

---

# 50. Duplicatas — hash perceptual futuro

Futuro:

Adicionar detecção de imagens visualmente quase idênticas usando perceptual hash.

Exemplos:

- mesma imagem em PNG e JPEG;
- mesma imagem com compressão diferente;
- screenshot com diferença mínima.

Isso deve ser opcional.

O MVP deve usar apenas hash exato.

---

# 51. Duplicatas — limpeza do Vault

Adicionar futuramente:

**Find duplicate images**

Esse comando analisa o Vault e apresenta grupos.

Exemplo:

```text
Duplicate group #1

attachments/a.png
attachments/a-copy.png
ticket/a.png
```

Permitir:

```text
Keep first
Keep selected
Replace references
Delete duplicates
```

Antes de excluir, atualizar todos os embeds relevantes.

---

# 52. Duplicatas — segurança

Nunca apagar automaticamente imagens existentes apenas porque possuem hash duplicado.

Detecção automática no paste pode reutilizar arquivos.

Limpeza de arquivos existentes deve sempre exigir ação explícita do usuário.

---

# 53. Copy Mode

Opções:

- Dedicated;
- Smart Copy;
- Always Rich Copy.

Default:

**Smart Copy**

---

# 54. Formatação

Preservar:

- bold;
- italic;
- headings;
- links;
- ordered lists;
- bullet lists;
- tables;
- code;
- blockquotes;
- checkboxes.

---

# 55. Compatibilidade

Prioridade:

### Tier 1

Movidesk.

### Tier 2

Outlook.

### Tier 3

- Gmail;
- Google Docs;
- Word;
- Slack;
- outros rich editors.

---

# 56. QA Workflow Mode

Menu rápido:

```text
Annotate
Mark error
Add arrow
Add rectangle
Add number
Resize
Normalize note images
Copy for ticket
```

---

# 57. Copy for Ticket

Pipeline:

```text
selection
↓
render Markdown
↓
resolve images
↓
apply resize
↓
optional normalize
↓
embed images
↓
generate clean HTML
↓
write clipboard
```

---

# 58. Screenshot Integration

Adicionar futuramente:

**Paste screenshot and annotate**

Fluxo:

```text
Win+Shift+S
↓
Ctrl+Shift+V
↓
Screenshot saved
↓
Duplicate check
↓
Embed inserted
↓
Annotation editor opens
```

---

# 59. Naming

Template configurável:

```text
{note}-{date}-{counter}
```

---

# 60. Organização automática

Configuração de pasta:

```text
attachments/
attachments/{note}/
images/
same-folder
custom
```

---

# 61. Editor — arquitetura

Biblioteca sugerida:

**Fabric.js**

Estrutura:

```text
src/
  editor/
    ImageEditorView.ts
    CanvasManager.ts

    tools/
      SelectTool.ts
      ArrowTool.ts
      RectangleTool.ts
      EllipseTool.ts
      TextTool.ts
      FreehandTool.ts
      MarkerTool.ts
      HighlightTool.ts
      RedactionTool.ts

    history/
      HistoryManager.ts

    persistence/
      AnnotationSerializer.ts

    export/
      ImageExporter.ts
```

---

# 62. Image Sizing — arquitetura

```text
src/
  sizing/
    ImageSizeNormalizer.ts
    ImageEmbedParser.ts
    ImageSizeSettings.ts
```

---

# 63. Paste — arquitetura

Criar módulo dedicado:

```text
src/
  paste/
    ClipboardImageReader.ts
    MultiImagePasteHandler.ts
    ImageFileWriter.ts
    ImageNamingService.ts
```

Responsabilidades:

```text
read clipboard
↓
extract images
↓
validate
↓
duplicate check
↓
generate name
↓
save
↓
insert embeds
```

---

# 64. Duplicatas — arquitetura

Criar módulo:

```text
src/
  duplicates/
    ImageHasher.ts
    DuplicateIndex.ts
    DuplicateDetector.ts
    DuplicateResolver.ts
```

Interfaces conceituais:

```ts
interface ImageHashEntry {
    hash: string;
    path: string;
    size: number;
    modifiedAt?: number;
}
```

```ts
interface DuplicateResult {
    duplicate: boolean;
    existingPaths: string[];
}
```

---

# 65. Clipboard — arquitetura

```text
src/
  clipboard/
    ClipboardWriter.ts
    HtmlClipboard.ts
    ImageClipboard.ts
```

---

# 66. Export

Default:

```text
PNG
```

Posteriormente:

- JPEG;
- WebP.

---

# 67. GIF

Não substituir silenciosamente GIF animado por imagem estática.

---

# 68. Keyboard shortcuts

Sugestões:

```text
V → Select
A → Arrow
R → Rectangle
E → Ellipse
T → Text
D → Draw
N → Number marker
H → Highlight

Ctrl+Z → Undo
Ctrl+Shift+Z → Redo
Ctrl+S → Save
Ctrl+Shift+C → Copy flattened image
```

Global:

```text
Ctrl+Alt+I → Normalize images using default width
```

---

# 69. Settings

## Clipboard

- Smart Copy;
- Preserve formatting;
- Preserve resize;
- Movidesk optimization.

## Editor

- Default color;
- Default line width;
- Default font size;
- Save mode;
- Annotation folder;
- Preserve editable annotation data.

## Image sizing

- Default normalized width;
- Preserve explicit height;
- Normalize on Copy for Ticket;
- Size presets.

## Paste

- Paste multiple images;
- Apply default width;
- Blank line between images;
- Naming template;
- Default image folder.

## Duplicates

- Enable duplicate detection;
- Duplicate action:
  - Reuse;
  - Ask;
  - Always save.
- Maintain local hash index.

## QA

- Auto increment markers;
- Screenshot naming;
- Quick tools;
- Redaction style.

---

# 70. MVP

## MVP 0.1 — Rich Copy

- Copy with Images;
- Markdown → HTML;
- imagens;
- resize;
- formatting;
- Movidesk compatibility.

## MVP 0.2 — Image Size Normalization

- Normalize image sizes;
- note;
- selection;
- hotkey;
- undo.

## MVP 0.3 — Multi-image Paste

- detectar várias imagens;
- salvar todas;
- inserir embeds;
- preservar ordem;
- naming automático;
- tamanho padrão opcional.

## MVP 0.4 — Duplicate Detection

- SHA-256;
- índice local;
- reutilizar arquivo existente;
- configuração Reuse / Ask / Always save;
- rebuild index.

## MVP 0.5 — Basic QA Editor

- select;
- arrow;
- rectangle;
- text;
- colors;
- undo/redo;
- save.

## MVP 0.6 — QA Tools

- number markers;
- highlight;
- redaction;
- crop;
- Save & Copy.

## MVP 0.7 — Non-destructive Editing

- `.qrc.json`.

---

# 71. Critério de aceitação — Multi-image Paste

Dado que o usuário possui quatro screenshots no clipboard:

```text
screenshot 1
screenshot 2
screenshot 3
screenshot 4
```

Ao colar uma única vez, o plugin deve produzir:

```md
![[ticket-1500-01.png|600]]

![[ticket-1500-02.png|600]]

![[ticket-1500-03.png|600]]

![[ticket-1500-04.png|600]]
```

quando largura automática estiver configurada como 600px.

---

# 72. Critério de aceitação — Duplicatas

Dado que:

```text
attachments/login-error.png
```

já existe no Vault.

E o usuário cola novamente uma imagem binariamente idêntica.

Com:

```text
Duplicate behavior: Reuse existing
```

o plugin deve:

1. detectar o mesmo SHA-256;
2. não criar novo arquivo;
3. reutilizar `login-error.png`;
4. inserir o embed correspondente.

Não deve criar:

```text
login-error-1.png
```

---

# 73. Critério principal de aceitação

O usuário deve conseguir:

1. tirar vários screenshots;
2. copiar/colar todos de uma vez;
3. evitar arquivos duplicados automaticamente;
4. deixar todos com 600px;
5. abrir uma evidência;
6. adicionar retângulo;
7. adicionar seta;
8. escrever uma observação;
9. salvar;
10. selecionar a análise;
11. executar `Copy for Ticket`;
12. colar no Movidesk.

O resultado deve possuir:

- texto formatado;
- screenshots;
- imagens anotadas;
- tamanho padronizado;
- ordem correta;
- nenhuma referência Markdown visível;
- nenhum arquivo duplicado desnecessário.

---

# 74. Diferencial do produto

O produto deve funcionar como um:

> **Workspace de evidências para QA dentro do Obsidian.**

Integra:

```text
Capture
+
Batch Paste
+
Deduplication
+
Annotation
+
Documentation
+
Resize
+
Normalization
+
Clipboard
+
Ticket
```

---

# 75. Princípio central

O usuário não deveria precisar:

- salvar cada screenshot manualmente;
- colar imagens uma por uma;
- criar várias cópias da mesma imagem;
- abrir Paint;
- abrir Snipping Tool;
- redimensionar cada evidência manualmente;
- abrir Explorer;
- corrigir embeds;
- copiar imagem por imagem para o ticket.

Objetivo:

**Capture → Paste → Deduplicate → Annotate → Normalize → Explain → Copy → Ticket.**
<div align="center">

# Visual Kit

### Screenshots, anotações e documentação. Dentro do Obsidian.

Transforme capturas de tela em evidências organizadas — da colagem ao ticket.

**Desktop · Processamento local · Obsidian 1.8+ · v0.7.0**

[Instalação](#instalação) · [Primeiros passos](#primeiros-passos) · [Recursos](#recursos) · [Desenvolvimento](#desenvolvimento)

</div>

---

O **Visual Kit** reúne o trabalho com imagens em um só fluxo: cole várias capturas, reaproveite duplicatas, destaque o que importa, padronize os tamanhos e copie a documentação com imagens para um editor rich-text.

Feito para QA, suporte, reporte de bugs e qualquer pessoa que precise explicar algo com screenshots.

```text
Capturar → Colar → Deduplicar → Anotar → Padronizar → Documentar → Copiar
```

## Recursos

| Recurso                      | O que você pode fazer                                                                             |
| :--------------------------- | :------------------------------------------------------------------------------------------------ |
| **Colagem em lote**          | Inserir várias imagens de uma vez, na ordem recebida, com nomes e pasta configuráveis.            |
| **Duplicatas por conteúdo**  | Reutilizar imagens binariamente idênticas com SHA-256; escolher entre Reuse, Ask e Always save.   |
| **Editor integrado**         | Adicionar setas, retângulos, elipses, texto multilinha, traços livres e marcadores numerados.     |
| **Ferramentas de evidência** | Destacar áreas, aplicar tarjas opacas e recortar a imagem.                                        |
| **Edição reversível**        | Mover, redimensionar, alterar propriedades e usar undo/redo. Salvar dados editáveis junto ao PNG. |
| **Tamanho consistente**      | Normalizar nota ou seleção para 400, 600, 800 px ou uma largura personalizada.                    |
| **Cópia rica**               | Copiar texto formatado e imagens locais com dimensões, em HTML e texto simples.                   |
| **Save & Copy**              | Salvar a imagem anotada e copiá-la em uma única ação.                                             |

## Instalação

### Pelo pacote pronto

1. Extraia **`visual-kit-0.7.0.zip`**, disponível na pasta `dist` do projeto preparado.
2. Copie a pasta **`visual-kit`** para a pasta de plugins do seu vault:

   ```text
   Seu Vault/
   └── .obsidian/
       └── plugins/
           └── visual-kit/
               ├── main.js
               ├── manifest.json
               └── styles.css
   ```

3. Reinicie o Obsidian.
4. Abra **Configurações → Plugins da comunidade** e ative **Visual Kit**. Se o modo restrito estiver ativo, permita plugins da comunidade primeiro.

Os arquivos devem ficar diretamente dentro de `visual-kit`, sem uma segunda pasta `visual-kit` aninhada.

> Esta versão usa instalação manual. O plugin ainda não foi publicado no catálogo de plugins da comunidade. Os arquivos gerados em `dist` não são versionados; ao clonar o repositório, use o build abaixo.

### Pelo código-fonte

```sh
npm ci
npm run build
```

Copie a pasta gerada **`dist/visual-kit`** para `.obsidian/plugins/` do vault. O build inclui as dependências necessárias; não copie `node_modules` para o Obsidian.

### Se você instalou a versão anterior

O identificador mudou de `qa-rich-copy` para `visual-kit`. Desative o plugin antigo antes de ativar o novo, para evitar dois manipuladores de paste/copy. Para manter preferências, copie o `data.json` da pasta antiga para a nova com o Obsidian fechado.

Os arquivos de anotações continuam usando **`.qrc.json`** para manter compatibilidade com as evidências já criadas.

## Primeiros passos

1. **Cole suas imagens.** Abra uma nota e pressione `Ctrl+V`. Imagens idênticas às existentes são reutilizadas por padrão.
2. **Padronize a largura.** Na paleta de comandos, procure **Visual Kit: Normalize image sizes** e escolha, por exemplo, `600 px`.
3. **Anote uma evidência.** Clique com o botão direito na imagem e escolha **Annotate**, ou posicione o cursor no embed e execute **Annotate image**.
4. **Destaque o problema.** Desenhe uma seta, um retângulo e uma observação. Salve com **Save as new** para preservar o original.
5. **Atualize a nota.** Escolha substituir o embed, manter o original ou inserir a versão anotada abaixo.
6. **Copie a análise.** Selecione o conteúdo e execute **Copy for Ticket**. Sem seleção, o comando usa a nota inteira.
7. **Cole no destino.** Confira as imagens e a formatação no editor do ticket.

> A aceitação das imagens depende do editor de destino. A integração real com Movidesk, Outlook e outros aplicativos ainda precisa de validação manual; não há upload de imagens para esses serviços.

## Comandos

Todos aparecem na paleta com o prefixo **Visual Kit**.

| Comando                                | Ação                                                                    |
| :------------------------------------- | :---------------------------------------------------------------------- |
| `Copy with Images`                     | Copia a seleção ou nota com texto formatado e imagens locais embutidas. |
| `Copy for Ticket`                      | Faz a cópia rica, com normalização opcional somente no HTML exportado.  |
| `Annotate image`                       | Abre a imagem do embed sob o cursor no editor.                          |
| `Normalize image sizes`                | Abre a escolha de largura, preset e escopo.                             |
| `Normalize images using default width` | Aplica a largura padrão à seleção ou, se não houver seleção, à nota.    |
| `Rebuild image duplicate index`        | Reconstrói o índice local de hashes das imagens.                        |

### Modos de cópia

| Modo                    | Comportamento no editor                             |
| :---------------------- | :-------------------------------------------------- |
| **Smart Copy** — padrão | Intercepta a cópia quando a seleção contém imagens. |
| **Dedicated**           | A cópia rica só acontece pelos comandos do plugin.  |
| **Always Rich Copy**    | Intercepta a cópia de qualquer seleção textual.     |

### Atalhos do editor de imagens

| Tecla                      | Ferramenta ou ação                         |
| :------------------------- | :----------------------------------------- |
| `V` / `A` / `R` / `E`      | Seleção / seta / retângulo / elipse        |
| `T` / `D` / `N` / `H`      | Texto / desenho livre / número / destaque  |
| `Delete` ou `Backspace`    | Excluir objetos selecionados               |
| `Ctrl+Z`                   | Desfazer                                   |
| `Ctrl+Shift+Z` ou `Ctrl+Y` | Refazer                                    |
| `Ctrl+S`                   | Salvar usando o modo configurado           |
| `Ctrl+Shift+C`             | Copiar imagem renderizada com as anotações |
| `Ctrl` + roda do mouse     | Zoom                                       |
| `Espaço` + arrastar        | Navegar pela imagem                        |

No macOS, use `Cmd` no lugar de `Ctrl`. A normalização rápida usa `Ctrl+Alt+I` (`Cmd+Option+I` no macOS). Os atalhos globais podem ser alterados em **Configurações → Teclas de atalho**.

## Configurações que fazem diferença

| Configuração                     | Padrão                    |
| :------------------------------- | :------------------------ |
| Largura de normalização          | `600 px`                  |
| Aplicar largura ao colar         | Desativado                |
| Linha em branco entre imagens    | Ativado                   |
| Pasta de imagens                 | `attachments`             |
| Template de nome                 | `{note}-{date}-{counter}` |
| Ação para duplicatas             | Reutilizar existente      |
| Preservar altura explícita       | Desativado                |
| Normalizar ao copiar para ticket | Desativado                |
| Salvar dados editáveis           | Ativado                   |
| Modo de salvamento               | Nova imagem               |

Pastas aceitam valores como `attachments`, `attachments/{note}`, `images`, `same-folder` ou outro caminho relativo ao vault.

A normalização altera apenas o tamanho visual no Markdown, preservando o arquivo da imagem. Exemplo com `600 px`:

```md
![[login.png|600]]

![[erro.png|600]]

![Dashboard|600](dashboard.png)
```

Embeds de PDF, áudio, vídeo, Canvas e notas não são redimensionados. Exemplos dentro de código também são preservados. Uma única ação de desfazer reverte a normalização.

## Salvamento e privacidade

O processamento acontece localmente, sem servidores, APIs de upload ou serviços de edição remota.

- **Save as new:** cria um PNG anotado sem sobrescrever o original.
- **Save copy:** permite um nome personalizado.
- **Replace original:** exige confirmação e está disponível para PNG.
- **Flatten image:** transforma as anotações da sessão em pixels; salve depois para gravar o resultado.
- **Dados editáveis:** o arquivo `imagem.qrc.json` guarda a imagem-base e os objetos para retomar a edição.

> **Ao compartilhar uma evidência com tarjas, envie apenas o PNG exportado.** O original e o `.qrc.json` podem conter os dados que você ocultou visualmente.

Imagens remotas não são baixadas durante a exportação. GIFs exigem confirmação para edição de um frame e não são sobrescritos por PNG. A detecção de duplicatas nunca apaga arquivos existentes automaticamente.

## Limites desta versão

- **Somente desktop.** Windows é a plataforma prioritária; macOS e Linux ainda precisam de validação real. Mobile não está incluído.
- **Clipboard depende da origem.** Alguns aplicativos fornecem apenas uma imagem, mesmo com várias selecionadas. Nesses casos, copie os arquivos de imagem.
- **Hash exato.** A mesma imagem com outra compressão ou formato será tratada como um arquivo diferente.
- **Falha parcial preserva sucessos.** O plugin informa os itens que falharam. Se a nota mudar durante a colagem, os embeds são acrescentados ao final da nota original.
- **Integração manual pendente.** Os testes automatizados não confirmam a experiência ponta a ponta dentro do Obsidian ou a aceitação do clipboard pelo Movidesk.

## Desenvolvimento

Use Node.js compatível com as dependências do projeto; a implementação foi validada com Node.js 24.

```sh
npm ci
npm run check
npm test
npm run build
```

| Comando          | Finalidade                                               |
| :--------------- | :------------------------------------------------------- |
| `npm run check`  | Verificar tipos TypeScript                               |
| `npm test`       | Executar os testes de lógica, fluxo, HTML e rasterização |
| `npm run build`  | Gerar `main.js` e a pasta instalável `dist/visual-kit`   |
| `npm run format` | Formatar código e documentação                           |

```text
src/
├── clipboard/    # HTML, imagens e escrita no clipboard
├── duplicates/   # SHA-256 e índice local
├── editor/       # Fabric.js, ferramentas, histórico e persistência
├── paste/        # Leitura do clipboard, nomes e colagem em lote
├── sizing/       # Parsing de embeds e normalização
├── main.ts       # Comandos, eventos, menus e configurações
└── settings.ts   # Preferências e valores padrão
tests/           # Testes automatizados e adaptadores de teste
docs/            # Especificação original do produto
```

Fabric.js é incluído no bundle. Obsidian e Electron são fornecidos pelo aplicativo. A licença do Fabric acompanha o pacote em `FABRIC-LICENSE.txt`.

Veja [VALIDATION.md](VALIDATION.md) para os resultados e os limites da cobertura automatizada. A [especificação v2.2](docs/spec-v2.2.md) mantém o nome original do produto como referência histórica.

## Checklist para testar no seu vault

- [ ] Colar quatro imagens e conferir ordem, nomes e largura opcional.
- [ ] Colar novamente e confirmar a reutilização sem arquivos extras.
- [ ] Anotar com seta, retângulo e texto; salvar e reabrir o PNG.
- [ ] Usar undo/redo, recorte e cópia da imagem anotada.
- [ ] Normalizar nota/seleção e desfazer em uma ação.
- [ ] Copiar texto com lista, tabela, código, checkbox e screenshots.
- [ ] Colar no Movidesk e conferir imagens, dimensões e formatação.

## Próximos passos

Itens futuros previstos no spec: Paste & Annotate em lote, Save & Next, atalho dedicado para screenshots, comparação perceptual, limpeza guiada de duplicatas, blur/pixelate, normalização por seção e exportação JPEG/WebP.

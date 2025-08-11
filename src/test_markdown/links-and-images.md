# Links and Images

Markdown makes it simple to embed links and images in your documents.

### Links

[Inline link](https://example.com)

[Link with title](https://example.com "This is a title")

[Reference link][1]

Direct URL: https://example.com

[1]: https://example.com

### Images

![Alt text](https://via.placeholder.com/300x200 "Image title")

![Reference-style image][image-ref]

[image-ref]: https://via.placeholder.com/400x300 "Reference image"

---
[Back to Table of Contents](./README.md)```

***

### 6. File: `code-and-syntax-highlighting.md`

```markdown
# Code and Syntax Highlighting

Markdown is excellent for technical documentation, offering robust support for inline code and code blocks with syntax highlighting.

### Inline Code

Use `console.log()` to print to the console.

### Code Blocks

#### JavaScript

```javascript
// JavaScript example
function greetUser(name) {
  const greeting = `Hello, ${name}!`;
  console.log(greeting);
}
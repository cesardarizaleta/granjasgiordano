#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Uso: node scripts/generate-feature.js <feature-name>");
  console.error("Ejemplo: node scripts/generate-feature.js productos");
  process.exit(1);
}

const featureName = args[0].toLowerCase();
const FeatureName = featureName.charAt(0).toUpperCase() + featureName.slice(1);

const templatesDir = path.join(__dirname, "..", "templates", "feature");
const featuresDir = path.join(__dirname, "..", "src", "features");
const featureDir = path.join(featuresDir, featureName);

// Función para reemplazar placeholders
function replacePlaceholders(content) {
  return content.replace(/\{\{name\}\}/g, featureName).replace(/\{\{Name\}\}/g, FeatureName);
}

// Función para copiar template
function copyTemplate(templatePath, targetPath) {
  const content = fs.readFileSync(templatePath, "utf8");
  const replacedContent = replacePlaceholders(content);
  fs.writeFileSync(targetPath, replacedContent);
}

// Función para copiar directorio recursivamente
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destName = replacePlaceholders(entry.name);
    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyTemplate(srcPath, destPath);
    }
  }
}

// Verificar si la feature ya existe
if (fs.existsSync(featureDir)) {
  console.error(`La feature "${featureName}" ya existe en ${featureDir}`);
  process.exit(1);
}

// Crear directorio de la feature
fs.mkdirSync(featureDir, { recursive: true });

// Copiar templates
copyDirectory(templatesDir, featureDir);

console.log(`✅ Feature "${featureName}" generada exitosamente en ${featureDir}`);

// Actualizar src/services/index.ts para exportar el nuevo servicio
const servicesIndexPath = path.join(__dirname, "..", "src", "services", "index.ts");
let servicesIndexContent = fs.readFileSync(servicesIndexPath, "utf8");

// Agregar export del servicio
const exportLine = `export { ${featureName}Service } from "@/features/${featureName}/services/${featureName}Service";`;
if (!servicesIndexContent.includes(exportLine)) {
  servicesIndexContent += `\n${exportLine}`;
  fs.writeFileSync(servicesIndexPath, servicesIndexContent);
  console.log(`✅ Servicio exportado en src/services/index.ts`);
}

// Actualizar src/features/index.ts si existe
const featuresIndexPath = path.join(__dirname, "..", "src", "features", "index.ts");
if (fs.existsSync(featuresIndexPath)) {
  let featuresIndexContent = fs.readFileSync(featuresIndexPath, "utf8");
  const exportLine = `export * from "./${featureName}";`;
  if (!featuresIndexContent.includes(exportLine)) {
    featuresIndexContent += `\n${exportLine}`;
    fs.writeFileSync(featuresIndexPath, featuresIndexContent);
    console.log(`✅ Feature exportada en src/features/index.ts`);
  }
}

console.log("\n📝 Próximos pasos:");
console.log(
  `1. Revisar y ajustar los tipos en src/features/${featureName}/types/${featureName}.ts`
);
console.log(
  `2. Implementar la lógica del servicio en src/features/${featureName}/services/${featureName}Service.ts`
);
console.log(`3. Crear componentes adicionales en src/features/${featureName}/components/`);
console.log(`4. Agregar rutas en src/App.tsx`);
console.log(`5. Actualizar la navegación si es necesario`);

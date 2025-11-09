const fs = require('fs');
const path = require('path');

// Configuração
const rbx_DIR = path.join(__dirname, 'rbx');
const OUTPUT_FILE = path.join(__dirname, 'output', 'script.lua');
const ENTRY_POINT = 'main.lua';

function readLuaFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Erro ao ler arquivo ${filePath}:`, error.message);
        return null;
    }
}

function cleanLuaCode(content) {

    let cleaned = content.replace(/^-->>.*$/gm, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
}

function extractRequires(content) {
    const requires = [];
    const regex = /require\(['"](.+?)['"]\)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        requires.push(match[1]);
    }
    
    return requires;
}

function requirePathTorbxPath(requirePath, currentCategory) {
    // Remove ./ ou ../
    let cleanPath = requirePath.replace(/^\.\.?\//, '');
    
    // Se o require é apenas './ModuleName' (mesma pasta)
    if (requirePath.startsWith('./') && !requirePath.includes('/')) {
        // Usa a categoria atual
        const moduleName = cleanPath.replace('.lua', '');
        if (currentCategory) {
            return `rbx.${currentCategory}.${moduleName}()`;
        }
    }
    
    // Se começa com ../, está voltando para a pasta rbx
    if (requirePath.startsWith('../')) {
        cleanPath = requirePath.replace(/^\.\.\//, '');
    }

    // Divide o caminho em partes
    const parts = cleanPath.split('/');
    
    if (parts.length >= 2) {
        const category = parts[0];
        const moduleName = parts[1].replace('.lua', '');
        return `rbx.${category}.${moduleName}()`;
    } else if (parts.length === 1) {
        // Se só tem um nome de arquivo e temos a categoria atual
        const moduleName = parts[0].replace('.lua', '');
        if (currentCategory) {
            return `rbx.${currentCategory}.${moduleName}()`;
        }
    }
    
    return null;
}

function processModuleContent(content, moduleName, category) {

    let processed = content.replace(/local\s+(\w+)\s*=\s*require\(['"](.+?)['"]\)/g, (match, varName, requirePath) => {
        const rbxRef = requirePathTorbxPath(requirePath, category);
        if (rbxRef) {
            return `local ${varName} = ${rbxRef}`;
        }
        return match;
    });
    
    processed = cleanLuaCode(processed);
    
    return processed;
}

function indentCode(code, spaces) {
    const indent = ' '.repeat(spaces);
    return code.split('\n').map(line => {
        if (line.trim() === '') return '';
        return indent + line;
    }).join('\n');
}

function scanDirectory(dir, category = '') {
    const files = fs.readdirSync(dir);
    const modules = [];
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {

            const subModules = scanDirectory(fullPath, file);
            modules.push(...subModules);
        } else if (file.endsWith('.lua') && file !== ENTRY_POINT) {
            const relativePath = path.relative(rbx_DIR, fullPath).replace(/\\/g, '/');
            const moduleName = path.basename(file, '.lua');
            
            modules.push({
                name: moduleName,
                category: category || path.dirname(relativePath).split('/')[0],
                path: fullPath,
                relativePath: relativePath
            });
        }
    }
    
    return modules;
}

function generateModuleFunction(module) {
    const content = readLuaFile(module.path);
    if (!content) return null;
    
    const processedBody = processModuleContent(content, module.name, module.category);
    const indentedBody = indentCode(processedBody, 12);
    
    return `        ${module.name} = function()
${indentedBody}
        end`;
}

function generateBundle() {
    console.log('🔍 Escaneando módulos...');
    const modules = scanDirectory(rbx_DIR);
    
    console.log(`📦 Encontrados ${modules.length} módulos`);

    const categorizedModules = {
        Games: [],
        Libs: [],
        Modules: []
    };
    
    for (const module of modules) {
        const category = module.category;
        if (categorizedModules[category]) {
            categorizedModules[category].push(module);
        }
    }
    
    let rbxTable = '';
    rbxTable += '-- Generated: ' + new Date().toLocaleString() + '\n\n';
    rbxTable += 'local rbx; rbx = {\n';
    
    for (const [category, categoryModules] of Object.entries(categorizedModules)) {
        if (categoryModules.length > 0) {
            rbxTable += `    ${category} = {\n`;
            
            for (const module of categoryModules) {
                console.log(`  ✅ Processando: ${category}/${module.name}`);
                const moduleCode = generateModuleFunction(module);
                if (moduleCode) {
                    rbxTable += moduleCode + ',\n';
                }
            }
            
            rbxTable += '    },\n';
        }
    }
    
    rbxTable += '}\n\n';
    
    const mainPath = path.join(rbx_DIR, ENTRY_POINT);
    const mainContent = readLuaFile(mainPath);
    
    if (mainContent) {
        console.log('  ✅ Processando: main.lua');
        
        // Remove a definição de folders se existir
        let processedMain = mainContent.replace(/local folders = \{[\s\S]*?\n\}/m, '');

        // Substitui folders.category.module() por rbx.Category.Module()
        processedMain = processedMain.replace(/local (\w+) = folders\.(\w+)\.(\w+)\(\)/g, (match, varName, category, module) => {
            const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1);
            const moduleName = modules.find(m => m.name.toLowerCase() === module.toLowerCase())?.name || module;
            return `local ${varName} = rbx.${categoryCapitalized}.${moduleName}()`;
        });
        
        // Substitui require('./Path/Module') por rbx.Path.Module()
        processedMain = processedMain.replace(/local\s+(\w+)\s*=\s*require\(['"](.+?)['"]\)/g, (match, varName, requirePath) => {
            const rbxRef = requirePathTorbxPath(requirePath, '');
            if (rbxRef) {
                return `local ${varName} = ${rbxRef}`;
            }
            return match;
        });
        
        // Remove underscores de variáveis não usadas opcionalmente
        processedMain = processedMain.replace(/local _(\w+) = rbx\./g, 'local _$1 = rbx.');
        
        // Limpa comentários de seção
        processedMain = cleanLuaCode(processedMain);
        
        // Adiciona o código principal
        rbxTable += '-- Main Code\n';
        rbxTable += processedMain;
    }
    
    return rbxTable;
}

function saveBundle(content) {
    const outputDir = path.dirname(OUTPUT_FILE);
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
    console.log(`\n✨ Bundle criado com sucesso: ${OUTPUT_FILE}`);
    
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`📊 Tamanho do arquivo: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Copia automaticamente para a pasta Wave
    const WAVE_DIR = path.join('C:', 'Users', 'aeris', 'AppData', 'Local', 'Wave', 'scripts');
    const WAVE_FILE = path.join(WAVE_DIR, 'AERISHUB.lua');
    
    try {
        if (!fs.existsSync(WAVE_DIR)) {
            fs.mkdirSync(WAVE_DIR, { recursive: true });
        }
        
        fs.copyFileSync(OUTPUT_FILE, WAVE_FILE);
        console.log(`📋 Cópia criada: ${WAVE_FILE}`);
    } catch (error) {
        console.error(`⚠️ Erro ao copiar para Wave: ${error.message}`);
    }
}

function main() {
    console.log('🚀 Iniciando bundler AERIS HUB...\n');
    
    try {
        const bundle = generateBundle();
        saveBundle(bundle);
        console.log('\n✅ Processo concluído!');
    } catch (error) {
        console.error('\n❌ Erro durante o bundling:', error);
        process.exit(1);
    }
}

// Executa o bundler
main();

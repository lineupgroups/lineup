import os

def update_preview(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Text Colors
    content = content.replace('text-gray-900', 'text-brand-white font-black italic uppercase tracking-wider')
    content = content.replace('text-gray-700', 'text-neutral-300')
    content = content.replace('text-gray-600', 'text-neutral-400')
    content = content.replace('text-gray-500', 'text-neutral-500')
    content = content.replace('text-gray-400', 'text-neutral-500')
    content = content.replace('text-gray-300', 'text-neutral-400')

    # Backgrounds and Borders
    content = content.replace('bg-white', 'bg-[#111]')
    content = content.replace('bg-gray-800', 'bg-neutral-900')
    content = content.replace('bg-gray-100', 'bg-neutral-900')
    content = content.replace('bg-gray-50', 'bg-neutral-900 border border-neutral-800')
    content = content.replace('bg-gray-200', 'bg-neutral-800')
    content = content.replace('border-gray-200', 'border-neutral-800')
    content = content.replace('border-gray-100', 'border-neutral-800')

    # Accents
    content = content.replace('bg-orange-100 text-orange-800', 'bg-brand-acid/10 border border-brand-acid/20 text-brand-acid font-black uppercase tracking-widest')
    content = content.replace('bg-gradient-to-r from-orange-500 to-red-500 text-white', 'bg-brand-acid text-brand-black font-black uppercase tracking-widest')
    content = content.replace('bg-gradient-to-r from-orange-500 to-red-500 h-3', 'bg-brand-acid h-3 shadow-[0_0_10px_rgba(204,255,0,0.5)]')
    
    # Border radius
    content = content.replace('rounded-xl', 'rounded-3xl border border-neutral-800')
    content = content.replace('rounded-lg', 'rounded-2xl')
    
    # Specific elements
    content = content.replace('text-3xl font-bold', 'text-3xl font-black italic uppercase')
    content = content.replace('text-xl font-bold', 'text-xl font-black italic uppercase')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_preview('src/components/projectCreation/ProjectPreview.tsx')

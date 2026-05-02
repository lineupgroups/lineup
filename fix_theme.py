import os

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Layouts and texts
    content = content.replace('text-gray-900', 'text-brand-white')
    content = content.replace('text-gray-800', 'text-brand-white/90')
    content = content.replace('text-gray-700', 'text-neutral-300')
    content = content.replace('text-gray-600', 'text-neutral-400')
    content = content.replace('text-gray-500', 'text-neutral-500')
    content = content.replace('text-gray-400', 'text-neutral-600')
    
    # Backgrounds and borders
    content = content.replace('bg-gray-50', 'bg-brand-black')
    content = content.replace('bg-white', 'bg-[#111]')
    content = content.replace('border-gray-300', 'border-neutral-800')
    content = content.replace('border-gray-200', 'border-neutral-800')
    content = content.replace('bg-gray-100', 'bg-neutral-900')
    content = content.replace('hover:bg-gray-100', 'hover:bg-neutral-800')
    
    # Accents (Orange to Acid)
    content = content.replace('text-orange-500', 'text-brand-acid')
    content = content.replace('text-orange-600', 'text-brand-acid')
    content = content.replace('text-orange-900', 'text-brand-white')
    content = content.replace('text-orange-800', 'text-neutral-400')
    
    content = content.replace('border-orange-500', 'border-brand-acid')
    content = content.replace('border-orange-300', 'border-brand-acid/50')
    content = content.replace('border-orange-200', 'border-brand-acid/20')
    
    content = content.replace('bg-orange-50', 'bg-brand-acid/10')
    content = content.replace('bg-orange-100', 'bg-brand-acid/20 text-brand-acid')
    content = content.replace('hover:bg-orange-600', 'hover:bg-[#b3e600]')
    content = content.replace('bg-orange-500', 'bg-brand-acid text-brand-black')
    
    # Ring
    content = content.replace('focus:ring-orange-500', 'focus:ring-brand-acid')
    
    # Gradients
    content = content.replace('bg-gradient-to-r from-orange-500 to-red-500 text-white', 'bg-brand-acid text-brand-black')
    content = content.replace('bg-gradient-to-r from-orange-500 to-red-500', 'bg-brand-acid text-brand-black')
    content = content.replace('hover:from-orange-600 hover:to-red-600', 'hover:bg-[#b3e600]')
    content = content.replace('bg-gradient-to-r from-orange-50 to-red-50', 'bg-[#111]')
    content = content.replace('bg-gradient-to-r from-gray-50 to-white', 'bg-[#111]')

    # Inputs
    content = content.replace('w-full px-4 py-3 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-brand-acid focus:border-brand-acid', 'w-full px-5 py-4 bg-brand-black border border-neutral-800 rounded-2xl text-brand-white placeholder-neutral-600 focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-all')
    content = content.replace('w-full pl-10 pr-4 py-3 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-brand-acid focus:border-brand-acid', 'w-full pl-10 pr-4 py-3 bg-brand-black border border-neutral-800 rounded-2xl text-brand-white placeholder-neutral-600 focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-all')
    content = content.replace('w-full pl-16 pr-4 py-3 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-brand-acid focus:border-brand-acid', 'w-full pl-16 pr-4 py-3 bg-brand-black border border-neutral-800 rounded-2xl text-brand-white placeholder-neutral-600 focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-all')
    
    # Textarea (Story)
    content = content.replace('w-full px-4 py-3 border border-neutral-800 rounded-lg', 'w-full px-5 py-4 bg-brand-black border border-neutral-800 rounded-2xl text-brand-white')

    # Info boxes
    content = content.replace('bg-blue-50 border border-blue-200', 'bg-brand-acid/10 border border-brand-acid/20')
    content = content.replace('text-blue-700', 'text-brand-acid')
    content = content.replace('bg-yellow-50 border-yellow-200', 'bg-brand-orange/10 border-brand-orange/20')
    content = content.replace('text-yellow-800', 'text-brand-orange')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file('src/components/projectCreation/Step1Basics.tsx')
update_file('src/components/projectCreation/Step2Story.tsx')
update_file('src/components/projectCreation/Step3Launch.tsx')

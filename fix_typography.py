import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_all():
    files = [
        'src/components/projectCreation/Step1Basics.tsx',
        'src/components/projectCreation/Step2Story.tsx',
        'src/components/projectCreation/Step3Launch.tsx'
    ]
    for f in files:
        if not os.path.exists(f): continue
        
        # Headers
        replace_in_file(f, 'text-2xl font-bold text-brand-white', 'text-2xl font-black italic uppercase tracking-wider text-brand-white')
        
        # Labels
        replace_in_file(f, 'block text-sm font-medium text-neutral-300', 'block text-sm font-black italic uppercase tracking-wider text-brand-acid')
        
        # Buttons
        replace_in_file(f, 'rounded-lg', 'rounded-2xl')
        replace_in_file(f, 'bg-brand-acid text-brand-black rounded-2xl font-medium', 'bg-brand-acid text-brand-black font-black italic uppercase tracking-widest rounded-2xl')
        replace_in_file(f, 'bg-brand-acid text-brand-black text-white', 'bg-brand-acid text-brand-black font-black italic uppercase tracking-widest')
        replace_in_file(f, 'bg-[#111]/90', 'bg-brand-black/90')
        replace_in_file(f, 'hover:from-orange-600 hover:to-red-600', 'hover:bg-[#b3e600]')
        replace_in_file(f, 'hover:bg-orange-600', 'hover:bg-[#b3e600]')

        # Inputs that missed the first pass
        replace_in_file(f, 'border-gray-300', 'border-neutral-800')
        replace_in_file(f, 'focus:ring-orange-500', 'focus:ring-brand-acid')
        replace_in_file(f, 'focus:border-orange-500', 'focus:border-brand-acid')
        replace_in_file(f, 'bg-white', 'bg-[#111]')
        
        # Text areas and text inputs that are still basic
        replace_in_file(f, 'flex-1 px-4 py-2 border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-brand-acid', 'flex-1 px-5 py-4 bg-brand-black border border-neutral-800 rounded-2xl text-brand-white placeholder-neutral-600 focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-all')
        replace_in_file(f, 'w-32 px-4 py-2 border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-brand-acid', 'w-32 px-5 py-4 bg-brand-black border border-neutral-800 rounded-2xl text-brand-white placeholder-neutral-600 focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-all')
        
        # Story Tips banner
        replace_in_file(f, 'bg-blue-50 rounded-xl p-6 border border-blue-200', 'bg-[#111] border border-neutral-800 rounded-3xl p-6')
        replace_in_file(f, 'text-blue-600', 'text-brand-acid')
        replace_in_file(f, 'text-blue-900', 'text-brand-white font-black italic uppercase')
        replace_in_file(f, 'text-blue-800', 'text-neutral-400')
        replace_in_file(f, 'text-amber-600', 'text-brand-orange')
        
        # Back button
        replace_in_file(f, 'border border-neutral-800 text-neutral-300 rounded-2xl hover:bg-brand-black', 'border border-neutral-800 bg-neutral-900 text-brand-white font-black italic uppercase tracking-widest rounded-2xl hover:bg-neutral-800')

fix_all()

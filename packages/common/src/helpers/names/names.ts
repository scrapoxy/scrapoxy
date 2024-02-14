const names = [
    'academics',
    'affect',
    'aid',
    'algebra',
    'amenity',
    'anagram',
    'analyst',
    'ant',
    'appeal',
    'apricot',
    'arcade',
    'armoire',
    'awe',
    'balloonist',
    'ballpark',
    'banana',
    'banking',
    'belly',
    'bidding',
    'bitter',
    'blow',
    'bobcat',
    'borrower',
    'bottom',
    'bratwurst',
    'breakthrough',
    'buckle',
    'calculator',
    'choosing',
    'cirrus',
    'coal',
    'coat',
    'commotion',
    'continuity',
    'conviction',
    'country',
    'craftsman',
    'crawdad',
    'credibility',
    'cutting',
    'dessert',
    'dignity',
    'dimple',
    'dolphin',
    'download',
    'entrepreneur',
    'envelope',
    'essay',
    'expression',
    'fatigues',
    'fawn',
    'feast',
    'file',
    'forelimb',
    'fraud',
    'gadget',
    'gauge',
    'glut',
    'grin',
    'grub',
    'guilty',
    'habit',
    'hint',
    'honor',
    'imagination',
    'inequality',
    'inquiry',
    'issue',
    'jackfruit',
    'jade',
    'jam',
    'ketchup',
    'killer',
    'lever',
    'loading',
    'loan',
    'lord',
    'lyrics',
    'major',
    'makeup',
    'manicure',
    'manor',
    'meantime',
    'messenger',
    'migration',
    'milepost',
    'moai',
    'mode',
    'niche',
    'north',
    'package',
    'panty',
    'paramedic',
    'partner',
    'patient',
    'pattypan',
    'peacoat',
    'permit',
    'pigpen',
    'pilaf',
    'pleat',
    'pneumonia',
    'popsicle',
    'preference',
    'principal',
    'print',
    'producer',
    'province',
    'puritan',
    'quartet',
    'quest',
    'rain',
    'relief',
    'sadness',
    'safety',
    'scotch',
    'senator',
    'sensor',
    'shred',
    'silly',
    'ski',
    'sleepiness',
    'snowman',
    'soundness',
    'speed',
    'spite',
    'stick',
    'stitcher',
    'stumbling',
    'suggestion',
    'supreme',
    'taxpayer',
    'tectonics',
    'tenor',
    'testing',
    'thongs',
    'thrill',
    'topic',
    'tortellini',
    'treaty',
    'tremor',
    'turf',
    'tv',
    'typhoon',
    'usher',
    'vampire',
    'variant',
    'veto',
    'yacht',
    'yurt',
];


export function randomName(): string {
    const
        prefix = names[ Math.floor(Math.random() * names.length) ],
        suffix = Math.floor(Math.random() * 1000000000)
            .toString(10);

    return prefix + suffix;
}


export function randomNames(count: number): string[] {
    const namesArr: string[] = [];

    for (let i = 0; i < count; ++i) {
        namesArr.push(randomName());
    }

    return namesArr;
}

export function getFreename(
    prefix: string, existings: string[]
): string {
    if (!existings.includes(prefix)) {
        return prefix;
    }

    let suffix = 2;
    let name = `${prefix} ${suffix}`;
    while (existings.includes(name)) {
        name = `${prefix} ${suffix}`;
        suffix++;
    }

    return name;
}

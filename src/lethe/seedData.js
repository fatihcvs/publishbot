const animals = [
  { animalId: 'dog', name: 'Köpek', emoji: '🐶', rarity: 'common', baseHp: 80, baseStr: 8, baseDef: 8, baseSpd: 10, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'cat', name: 'Kedi', emoji: '🐱', rarity: 'common', baseHp: 70, baseStr: 7, baseDef: 7, baseSpd: 12, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'mouse', name: 'Fare', emoji: '🐭', rarity: 'common', baseHp: 50, baseStr: 5, baseDef: 5, baseSpd: 15, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'hamster', name: 'Hamster', emoji: '🐹', rarity: 'common', baseHp: 55, baseStr: 5, baseDef: 6, baseSpd: 14, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'rabbit', name: 'Tavşan', emoji: '🐰', rarity: 'common', baseHp: 65, baseStr: 6, baseDef: 6, baseSpd: 16, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'fox', name: 'Tilki', emoji: '🦊', rarity: 'common', baseHp: 75, baseStr: 9, baseDef: 7, baseSpd: 13, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'bear', name: 'Ayı', emoji: '🐻', rarity: 'common', baseHp: 120, baseStr: 12, baseDef: 12, baseSpd: 6, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'panda', name: 'Panda', emoji: '🐼', rarity: 'common', baseHp: 110, baseStr: 10, baseDef: 11, baseSpd: 7, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'koala', name: 'Koala', emoji: '🐨', rarity: 'common', baseHp: 70, baseStr: 6, baseDef: 8, baseSpd: 8, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'tiger', name: 'Kaplan', emoji: '🐯', rarity: 'common', baseHp: 100, baseStr: 14, baseDef: 9, baseSpd: 11, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'lion', name: 'Aslan', emoji: '🦁', rarity: 'common', baseHp: 105, baseStr: 15, baseDef: 10, baseSpd: 10, sellPrice: 5, xpReward: 1, regionId: 'desert' },
  { animalId: 'cow', name: 'İnek', emoji: '🐮', rarity: 'common', baseHp: 130, baseStr: 8, baseDef: 14, baseSpd: 5, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'pig', name: 'Domuz', emoji: '🐷', rarity: 'common', baseHp: 100, baseStr: 7, baseDef: 10, baseSpd: 7, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'frog', name: 'Kurbağa', emoji: '🐸', rarity: 'common', baseHp: 60, baseStr: 6, baseDef: 5, baseSpd: 14, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'monkey', name: 'Maymun', emoji: '🐵', rarity: 'common', baseHp: 80, baseStr: 10, baseDef: 7, baseSpd: 13, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'chicken', name: 'Tavuk', emoji: '🐔', rarity: 'common', baseHp: 50, baseStr: 5, baseDef: 4, baseSpd: 11, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'penguin', name: 'Penguen', emoji: '🐧', rarity: 'common', baseHp: 75, baseStr: 7, baseDef: 9, baseSpd: 8, sellPrice: 5, xpReward: 1, regionId: 'mountain' },
  { animalId: 'bird', name: 'Kuş', emoji: '🐦', rarity: 'common', baseHp: 45, baseStr: 5, baseDef: 4, baseSpd: 18, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'chick', name: 'Civciv', emoji: '🐤', rarity: 'common', baseHp: 35, baseStr: 3, baseDef: 3, baseSpd: 12, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'duck', name: 'Ördek', emoji: '🦆', rarity: 'common', baseHp: 65, baseStr: 6, baseDef: 6, baseSpd: 10, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'eagle', name: 'Kartal', emoji: '🦅', rarity: 'common', baseHp: 80, baseStr: 12, baseDef: 6, baseSpd: 16, sellPrice: 5, xpReward: 1, regionId: 'mountain' },
  { animalId: 'owl', name: 'Baykuş', emoji: '🦉', rarity: 'common', baseHp: 70, baseStr: 8, baseDef: 7, baseSpd: 12, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'wolf', name: 'Kurt', emoji: '🐺', rarity: 'common', baseHp: 95, baseStr: 13, baseDef: 9, baseSpd: 12, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'boar', name: 'Yaban Domuzu', emoji: '🐗', rarity: 'common', baseHp: 110, baseStr: 11, baseDef: 12, baseSpd: 8, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'horse', name: 'At', emoji: '🐴', rarity: 'common', baseHp: 100, baseStr: 10, baseDef: 8, baseSpd: 18, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'unicorn', name: 'Tek Boynuz', emoji: '🦄', rarity: 'common', baseHp: 90, baseStr: 9, baseDef: 9, baseSpd: 15, sellPrice: 5, xpReward: 1, regionId: 'void' },
  { animalId: 'bee', name: 'Arı', emoji: '🐝', rarity: 'common', baseHp: 30, baseStr: 8, baseDef: 2, baseSpd: 20, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'caterpillar', name: 'Tırtıl', emoji: '🐛', rarity: 'common', baseHp: 40, baseStr: 3, baseDef: 5, baseSpd: 3, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'butterfly', name: 'Kelebek', emoji: '🦋', rarity: 'common', baseHp: 35, baseStr: 4, baseDef: 3, baseSpd: 17, sellPrice: 5, xpReward: 1, regionId: 'forest' },
  { animalId: 'snail', name: 'Salyangoz', emoji: '🐌', rarity: 'common', baseHp: 60, baseStr: 4, baseDef: 15, baseSpd: 1, sellPrice: 5, xpReward: 1, regionId: 'forest' },

  { animalId: 'lizard', name: 'Kertenkele', emoji: '🦎', rarity: 'uncommon', baseHp: 75, baseStr: 9, baseDef: 8, baseSpd: 14, sellPrice: 25, xpReward: 5, regionId: 'desert' },
  { animalId: 'snake', name: 'Yılan', emoji: '🐍', rarity: 'uncommon', baseHp: 70, baseStr: 12, baseDef: 6, baseSpd: 15, sellPrice: 25, xpReward: 5, regionId: 'desert' },
  { animalId: 'turtle', name: 'Kaplumbağa', emoji: '🐢', rarity: 'uncommon', baseHp: 100, baseStr: 6, baseDef: 20, baseSpd: 2, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'trex', name: 'T-Rex', emoji: '🦖', rarity: 'uncommon', baseHp: 130, baseStr: 18, baseDef: 12, baseSpd: 9, sellPrice: 25, xpReward: 5, regionId: 'volcano' },
  { animalId: 'dino', name: 'Dinozor', emoji: '🦕', rarity: 'uncommon', baseHp: 140, baseStr: 14, baseDef: 14, baseSpd: 6, sellPrice: 25, xpReward: 5, regionId: 'volcano' },
  { animalId: 'octopus', name: 'Ahtapot', emoji: '🐙', rarity: 'uncommon', baseHp: 90, baseStr: 11, baseDef: 9, baseSpd: 10, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'squid', name: 'Kalamar', emoji: '🦑', rarity: 'uncommon', baseHp: 85, baseStr: 13, baseDef: 7, baseSpd: 12, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'shrimp', name: 'Karides', emoji: '🦐', rarity: 'uncommon', baseHp: 50, baseStr: 7, baseDef: 6, baseSpd: 16, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'lobster', name: 'Istakoz', emoji: '🦞', rarity: 'uncommon', baseHp: 80, baseStr: 14, baseDef: 15, baseSpd: 5, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'crab', name: 'Yengeç', emoji: '🦀', rarity: 'uncommon', baseHp: 70, baseStr: 12, baseDef: 16, baseSpd: 6, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'blowfish', name: 'Balon Balık', emoji: '🐡', rarity: 'uncommon', baseHp: 65, baseStr: 8, baseDef: 18, baseSpd: 7, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'tropical_fish', name: 'Tropikal Balık', emoji: '🐠', rarity: 'uncommon', baseHp: 55, baseStr: 6, baseDef: 5, baseSpd: 18, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'fish', name: 'Balık', emoji: '🐟', rarity: 'uncommon', baseHp: 50, baseStr: 5, baseDef: 5, baseSpd: 16, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'dolphin', name: 'Yunus', emoji: '🐬', rarity: 'uncommon', baseHp: 95, baseStr: 11, baseDef: 9, baseSpd: 17, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'whale', name: 'Balina', emoji: '🐳', rarity: 'uncommon', baseHp: 200, baseStr: 15, baseDef: 20, baseSpd: 3, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'shark', name: 'Köpek Balığı', emoji: '🦈', rarity: 'uncommon', baseHp: 120, baseStr: 18, baseDef: 10, baseSpd: 14, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'crocodile', name: 'Timsah', emoji: '🐊', rarity: 'uncommon', baseHp: 130, baseStr: 16, baseDef: 18, baseSpd: 6, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'flamingo', name: 'Flamingo', emoji: '🦩', rarity: 'uncommon', baseHp: 70, baseStr: 7, baseDef: 6, baseSpd: 14, sellPrice: 25, xpReward: 5, regionId: 'ocean' },
  { animalId: 'peacock', name: 'Tavus Kuşu', emoji: '🦚', rarity: 'uncommon', baseHp: 75, baseStr: 8, baseDef: 7, baseSpd: 12, sellPrice: 25, xpReward: 5, regionId: 'forest' },
  { animalId: 'parrot', name: 'Papağan', emoji: '🦜', rarity: 'uncommon', baseHp: 60, baseStr: 7, baseDef: 5, baseSpd: 15, sellPrice: 25, xpReward: 5, regionId: 'forest' },

  { animalId: 'sloth', name: 'Tembel Hayvan', emoji: '🦥', rarity: 'rare', baseHp: 90, baseStr: 8, baseDef: 12, baseSpd: 2, sellPrice: 100, xpReward: 25, regionId: 'forest' },
  { animalId: 'otter', name: 'Su Samuru', emoji: '🦦', rarity: 'rare', baseHp: 85, baseStr: 11, baseDef: 9, baseSpd: 14, sellPrice: 100, xpReward: 25, regionId: 'ocean' },
  { animalId: 'skunk', name: 'Kokarca', emoji: '🦨', rarity: 'rare', baseHp: 70, baseStr: 9, baseDef: 8, baseSpd: 11, sellPrice: 100, xpReward: 25, regionId: 'forest' },
  { animalId: 'kangaroo', name: 'Kanguru', emoji: '🦘', rarity: 'rare', baseHp: 110, baseStr: 14, baseDef: 10, baseSpd: 15, sellPrice: 100, xpReward: 25, regionId: 'desert' },
  { animalId: 'badger', name: 'Porsuk', emoji: '🦡', rarity: 'rare', baseHp: 95, baseStr: 13, baseDef: 14, baseSpd: 9, sellPrice: 100, xpReward: 25, regionId: 'forest' },
  { animalId: 'hedgehog', name: 'Kirpi', emoji: '🦔', rarity: 'rare', baseHp: 65, baseStr: 8, baseDef: 18, baseSpd: 8, sellPrice: 100, xpReward: 25, regionId: 'forest' },
  { animalId: 'bat', name: 'Yarasa', emoji: '🦇', rarity: 'rare', baseHp: 60, baseStr: 10, baseDef: 6, baseSpd: 20, sellPrice: 100, xpReward: 25, regionId: 'volcano' },
  { animalId: 'beaver', name: 'Kunduz', emoji: '🦫', rarity: 'rare', baseHp: 100, baseStr: 12, baseDef: 14, baseSpd: 7, sellPrice: 100, xpReward: 25, regionId: 'forest' },
  { animalId: 'rooster', name: 'Horoz', emoji: '🐓', rarity: 'rare', baseHp: 70, baseStr: 11, baseDef: 7, baseSpd: 13, sellPrice: 100, xpReward: 25, regionId: 'forest' },
  { animalId: 'turkey', name: 'Hindi', emoji: '🦃', rarity: 'rare', baseHp: 90, baseStr: 10, baseDef: 10, baseSpd: 9, sellPrice: 100, xpReward: 25, regionId: 'forest' },
  { animalId: 'dodo', name: 'Dodo', emoji: '🦤', rarity: 'rare', baseHp: 80, baseStr: 7, baseDef: 8, baseSpd: 5, sellPrice: 100, xpReward: 25, regionId: 'desert' },
  { animalId: 'seal', name: 'Fok', emoji: '🦭', rarity: 'rare', baseHp: 110, baseStr: 10, baseDef: 15, baseSpd: 8, sellPrice: 100, xpReward: 25, regionId: 'mountain' },
  { animalId: 'bison', name: 'Bizon', emoji: '🦬', rarity: 'rare', baseHp: 150, baseStr: 16, baseDef: 18, baseSpd: 6, sellPrice: 100, xpReward: 25, regionId: 'mountain' },
  { animalId: 'ox', name: 'Boğa', emoji: '🐂', rarity: 'rare', baseHp: 140, baseStr: 18, baseDef: 16, baseSpd: 7, sellPrice: 100, xpReward: 25, regionId: 'desert' },
  { animalId: 'mammoth', name: 'Mamut', emoji: '🦣', rarity: 'rare', baseHp: 180, baseStr: 20, baseDef: 22, baseSpd: 4, sellPrice: 100, xpReward: 25, regionId: 'mountain' },

  { animalId: 'dragon', name: 'Ejderha', emoji: '🐉', rarity: 'epic', baseHp: 200, baseStr: 28, baseDef: 22, baseSpd: 15, sellPrice: 500, xpReward: 100, regionId: 'volcano' },
  { animalId: 'giant_squid', name: 'Dev Kalamar', emoji: '🦑', rarity: 'epic', baseHp: 180, baseStr: 25, baseDef: 18, baseSpd: 12, sellPrice: 500, xpReward: 100, regionId: 'ocean' },
  { animalId: 'golden_eagle', name: 'Altın Kartal', emoji: '🦅', rarity: 'epic', baseHp: 150, baseStr: 26, baseDef: 14, baseSpd: 22, sellPrice: 500, xpReward: 100, regionId: 'mountain' },
  { animalId: 'silver_wolf', name: 'Gümüş Kurt', emoji: '🐺', rarity: 'epic', baseHp: 170, baseStr: 24, baseDef: 18, baseSpd: 18, sellPrice: 500, xpReward: 100, regionId: 'mountain' },
  { animalId: 'king_lion', name: 'Kral Aslan', emoji: '🦁', rarity: 'epic', baseHp: 190, baseStr: 28, baseDef: 20, baseSpd: 14, sellPrice: 500, xpReward: 100, regionId: 'desert' },
  { animalId: 'white_tiger', name: 'Beyaz Kaplan', emoji: '🐯', rarity: 'epic', baseHp: 185, baseStr: 30, baseDef: 18, baseSpd: 16, sellPrice: 500, xpReward: 100, regionId: 'mountain' },
  { animalId: 'polar_bear', name: 'Kutup Ayısı', emoji: '🐻‍❄️', rarity: 'epic', baseHp: 220, baseStr: 26, baseDef: 25, baseSpd: 10, sellPrice: 500, xpReward: 100, regionId: 'mountain' },
  { animalId: 'megalodon', name: 'Mega Köpekbalığı', emoji: '🦈', rarity: 'epic', baseHp: 250, baseStr: 32, baseDef: 22, baseSpd: 14, sellPrice: 500, xpReward: 100, regionId: 'ocean' },
  { animalId: 'raptor', name: 'Raptor', emoji: '🦖', rarity: 'epic', baseHp: 160, baseStr: 28, baseDef: 16, baseSpd: 24, sellPrice: 500, xpReward: 100, regionId: 'desert' },
  { animalId: 'brontosaurus', name: 'Brontosaurus', emoji: '🦕', rarity: 'epic', baseHp: 300, baseStr: 22, baseDef: 28, baseSpd: 5, sellPrice: 500, xpReward: 100, regionId: 'desert' },
  { animalId: 'kraken', name: 'Kraken', emoji: '🐙', rarity: 'epic', baseHp: 280, baseStr: 30, baseDef: 24, baseSpd: 8, sellPrice: 500, xpReward: 100, regionId: 'ocean' },
  { animalId: 'golden_peacock', name: 'Altın Tavus', emoji: '🦚', rarity: 'epic', baseHp: 140, baseStr: 18, baseDef: 16, baseSpd: 20, sellPrice: 500, xpReward: 100, regionId: 'forest' },
  { animalId: 'crystal_flamingo', name: 'Kristal Flamingo', emoji: '🦩', rarity: 'epic', baseHp: 130, baseStr: 16, baseDef: 18, baseSpd: 22, sellPrice: 500, xpReward: 100, regionId: 'ocean' },
  { animalId: 'sea_dragon', name: 'Deniz Ejderhası', emoji: '🐲', rarity: 'epic', baseHp: 240, baseStr: 28, baseDef: 26, baseSpd: 12, sellPrice: 500, xpReward: 100, regionId: 'ocean' },
  { animalId: 'rainbow_unicorn', name: 'Gökkuşağı Unicorn', emoji: '🦄', rarity: 'epic', baseHp: 180, baseStr: 22, baseDef: 20, baseSpd: 25, sellPrice: 500, xpReward: 100, regionId: 'void' },

  { animalId: 'phoenix', name: 'Anka Kuşu', emoji: '🐦‍🔥', rarity: 'legendary', baseHp: 300, baseStr: 40, baseDef: 30, baseSpd: 28, sellPrice: 2500, xpReward: 500, regionId: 'volcano' },
  { animalId: 'lightning_dragon', name: 'Şimşek Ejderhası', emoji: '🐉', rarity: 'legendary', baseHp: 350, baseStr: 45, baseDef: 32, baseSpd: 30, sellPrice: 2500, xpReward: 500, regionId: 'mountain' },
  { animalId: 'leviathan', name: 'Leviathan', emoji: '🐋', rarity: 'legendary', baseHp: 500, baseStr: 42, baseDef: 45, baseSpd: 12, sellPrice: 2500, xpReward: 500, regionId: 'ocean' },
  { animalId: 'cerberus', name: 'Cerberus', emoji: '🐕‍🦺', rarity: 'legendary', baseHp: 400, baseStr: 48, baseDef: 35, baseSpd: 20, sellPrice: 2500, xpReward: 500, regionId: 'volcano' },
  { animalId: 'moon_wolf', name: 'Ay Kurdu', emoji: '🐺', rarity: 'legendary', baseHp: 320, baseStr: 38, baseDef: 28, baseSpd: 35, sellPrice: 2500, xpReward: 500, regionId: 'void' },
  { animalId: 'sun_eagle', name: 'Güneş Kartalı', emoji: '🦅', rarity: 'legendary', baseHp: 280, baseStr: 44, baseDef: 25, baseSpd: 40, sellPrice: 2500, xpReward: 500, regionId: 'desert' },
  { animalId: 'rainbow_snake', name: 'Gökkuşağı Yılanı', emoji: '🐍', rarity: 'legendary', baseHp: 260, baseStr: 35, baseDef: 22, baseSpd: 38, sellPrice: 2500, xpReward: 500, regionId: 'desert' },
  { animalId: 'ice_dragon', name: 'Buz Ejderhası', emoji: '🐲', rarity: 'legendary', baseHp: 380, baseStr: 42, baseDef: 40, baseSpd: 18, sellPrice: 2500, xpReward: 500, regionId: 'mountain' },
  { animalId: 'storm_bird', name: 'Fırtına Kuşu', emoji: '🦢', rarity: 'legendary', baseHp: 290, baseStr: 40, baseDef: 26, baseSpd: 42, sellPrice: 2500, xpReward: 500, regionId: 'void' },
  { animalId: 'star_fox', name: 'Yıldız Tilkisi', emoji: '🦊', rarity: 'legendary', baseHp: 270, baseStr: 36, baseDef: 28, baseSpd: 45, sellPrice: 2500, xpReward: 500, regionId: 'void' },

  { animalId: 'dragon_king', name: 'Ejderha Kralı', emoji: '🐉', rarity: 'mythic', baseHp: 600, baseStr: 60, baseDef: 50, baseSpd: 35, sellPrice: 10000, xpReward: 2000, regionId: 'volcano' },
  { animalId: 'diamond_tiger', name: 'Elmas Kaplan', emoji: '🐅', rarity: 'mythic', baseHp: 500, baseStr: 65, baseDef: 45, baseSpd: 40, sellPrice: 10000, xpReward: 2000, regionId: 'mountain' },
  { animalId: 'galaxy_wolf', name: 'Galaksi Kurdu', emoji: '🐺', rarity: 'mythic', baseHp: 480, baseStr: 55, baseDef: 42, baseSpd: 50, sellPrice: 10000, xpReward: 2000, regionId: 'void' },
  { animalId: 'star_unicorn', name: 'Yıldız Unicorn', emoji: '🦄', rarity: 'mythic', baseHp: 450, baseStr: 50, baseDef: 48, baseSpd: 55, sellPrice: 10000, xpReward: 2000, regionId: 'void' },
  { animalId: 'crystal_phoenix', name: 'Kristal Phoenix', emoji: '🐦‍🔥', rarity: 'mythic', baseHp: 520, baseStr: 58, baseDef: 52, baseSpd: 42, sellPrice: 10000, xpReward: 2000, regionId: 'void' },
  { animalId: 'nebula_owl', name: 'Nebula Baykuşu', emoji: '🦉', rarity: 'mythic', baseHp: 420, baseStr: 52, baseDef: 45, baseSpd: 48, sellPrice: 10000, xpReward: 2000, regionId: 'void' },
  { animalId: 'meteor_lion', name: 'Meteor Aslanı', emoji: '🦁', rarity: 'mythic', baseHp: 550, baseStr: 62, baseDef: 48, baseSpd: 38, sellPrice: 10000, xpReward: 2000, regionId: 'void' },
  { animalId: 'light_dragon', name: 'Işık Ejderhası', emoji: '🐲', rarity: 'mythic', baseHp: 580, baseStr: 64, baseDef: 55, baseSpd: 45, sellPrice: 10000, xpReward: 2000, regionId: 'void' },

  { animalId: 'shadow_lord', name: 'Gölge Lord', emoji: '🦹', rarity: 'hidden', baseHp: 800, baseStr: 80, baseDef: 70, baseSpd: 60, sellPrice: 100000, xpReward: 10000, regionId: 'void' },
  { animalId: 'all_seeing', name: 'Tüm Gören', emoji: '🦅', rarity: 'hidden', baseHp: 750, baseStr: 75, baseDef: 75, baseSpd: 70, sellPrice: 100000, xpReward: 10000, regionId: 'void' },
  { animalId: 'void_creature', name: 'Void Yaratığı', emoji: '🐙', rarity: 'hidden', baseHp: 700, baseStr: 85, baseDef: 65, baseSpd: 65, sellPrice: 100000, xpReward: 10000, regionId: 'void' },
  { animalId: 'dark_god', name: 'Karanlık Tanrı', emoji: '🐉', rarity: 'hidden', baseHp: 900, baseStr: 90, baseDef: 80, baseSpd: 55, sellPrice: 100000, xpReward: 10000, regionId: 'void' },
  { animalId: 'chaos_entity', name: 'Kaos Varlığı', emoji: '🦑', rarity: 'hidden', baseHp: 850, baseStr: 88, baseDef: 72, baseSpd: 75, sellPrice: 100000, xpReward: 10000, regionId: 'void' },

  { animalId: 'king_in_the_north', name: 'King in the North', emoji: '👑', rarity: 'eternal', baseHp: 1500, baseStr: 150, baseDef: 120, baseSpd: 100, sellPrice: 1000000, xpReward: 100000, regionId: 'mountain' },

  // VIP Exclusive Animals (ThePublisher Server Only)
  { animalId: 'vip_phoenix', name: 'VIP Anka', emoji: '🔥', rarity: 'legendary', baseHp: 400, baseStr: 50, baseDef: 40, baseSpd: 35, sellPrice: 5000, xpReward: 1000, isVipExclusive: true },
  { animalId: 'vip_guardian', name: 'VIP Koruyucu', emoji: '🛡️', rarity: 'legendary', baseHp: 500, baseStr: 40, baseDef: 60, baseSpd: 25, sellPrice: 5000, xpReward: 1000, isVipExclusive: true },
  { animalId: 'vip_spirit', name: 'VIP Ruh', emoji: '👻', rarity: 'legendary', baseHp: 350, baseStr: 45, baseDef: 35, baseSpd: 50, sellPrice: 5000, xpReward: 1000, isVipExclusive: true }
];

// Seasonal Animals - Only catchable during their specific season
// Season: spring (Mar-May), summer (Jun-Aug), fall (Sep-Nov), winter (Dec-Feb)
const seasonalAnimals = [
  // SPRING ANIMALS (March, April, May) - Bahar Hayvanları
  { animalId: 'spring_bunny', name: 'Bahar Tavşanı', emoji: '🐇', rarity: 'common', baseHp: 70, baseStr: 7, baseDef: 7, baseSpd: 18, sellPrice: 10, xpReward: 2, season: 'spring' },
  { animalId: 'blossom_bird', name: 'Çiçek Kuşu', emoji: '🌸', rarity: 'common', baseHp: 55, baseStr: 6, baseDef: 5, baseSpd: 20, sellPrice: 10, xpReward: 2, season: 'spring' },
  { animalId: 'pollen_bee', name: 'Polen Arısı', emoji: '🐝', rarity: 'common', baseHp: 40, baseStr: 10, baseDef: 4, baseSpd: 22, sellPrice: 10, xpReward: 2, season: 'spring' },
  { animalId: 'rain_frog', name: 'Yağmur Kurbağası', emoji: '🐸', rarity: 'uncommon', baseHp: 75, baseStr: 9, baseDef: 8, baseSpd: 15, sellPrice: 35, xpReward: 8, season: 'spring' },
  { animalId: 'cherry_fox', name: 'Kiraz Tilkisi', emoji: '🦊', rarity: 'uncommon', baseHp: 90, baseStr: 12, baseDef: 10, baseSpd: 16, sellPrice: 35, xpReward: 8, season: 'spring' },
  { animalId: 'meadow_deer', name: 'Çayır Geyiği', emoji: '🦌', rarity: 'rare', baseHp: 120, baseStr: 14, baseDef: 13, baseSpd: 18, sellPrice: 150, xpReward: 35, season: 'spring' },
  { animalId: 'rainbow_butterfly', name: 'Gökkuşağı Kelebeği', emoji: '🦋', rarity: 'rare', baseHp: 50, baseStr: 8, baseDef: 6, baseSpd: 25, sellPrice: 150, xpReward: 35, season: 'spring' },
  { animalId: 'flower_spirit', name: 'Çiçek Ruhu', emoji: '🌺', rarity: 'epic', baseHp: 160, baseStr: 22, baseDef: 20, baseSpd: 24, sellPrice: 700, xpReward: 150, season: 'spring' },
  { animalId: 'sakura_dragon', name: 'Sakura Ejderhası', emoji: '🐉', rarity: 'epic', baseHp: 220, baseStr: 30, baseDef: 25, baseSpd: 20, sellPrice: 700, xpReward: 150, season: 'spring' },
  { animalId: 'rebirth_phoenix', name: 'Yeniden Doğuş Ankası', emoji: '🐦‍🔥', rarity: 'legendary', baseHp: 320, baseStr: 42, baseDef: 32, baseSpd: 30, sellPrice: 3000, xpReward: 600, season: 'spring' },
  { animalId: 'nature_titan', name: 'Doğa Titanı', emoji: '🌳', rarity: 'mythic', baseHp: 550, baseStr: 58, baseDef: 55, baseSpd: 35, sellPrice: 12000, xpReward: 2500, season: 'spring' },
  { animalId: 'spring_goddess', name: 'Bahar Tanrıçası', emoji: '🌷', rarity: 'hidden', baseHp: 820, baseStr: 82, baseDef: 75, baseSpd: 68, sellPrice: 120000, xpReward: 12000, season: 'spring' },

  // SUMMER ANIMALS (June, July, August) - Yaz Hayvanları
  { animalId: 'sun_lizard', name: 'Güneş Kertenkelesi', emoji: '🦎', rarity: 'common', baseHp: 75, baseStr: 9, baseDef: 8, baseSpd: 16, sellPrice: 10, xpReward: 2, season: 'summer' },
  { animalId: 'beach_crab', name: 'Plaj Yengeci', emoji: '🦀', rarity: 'common', baseHp: 65, baseStr: 8, baseDef: 12, baseSpd: 10, sellPrice: 10, xpReward: 2, season: 'summer' },
  { animalId: 'coral_fish', name: 'Mercan Balığı', emoji: '🐠', rarity: 'common', baseHp: 50, baseStr: 6, baseDef: 6, baseSpd: 18, sellPrice: 10, xpReward: 2, season: 'summer' },
  { animalId: 'tropical_parrot', name: 'Tropikal Papağan', emoji: '🦜', rarity: 'uncommon', baseHp: 70, baseStr: 10, baseDef: 7, baseSpd: 17, sellPrice: 35, xpReward: 8, season: 'summer' },
  { animalId: 'sand_turtle', name: 'Kum Kaplumbağası', emoji: '🐢', rarity: 'uncommon', baseHp: 120, baseStr: 8, baseDef: 22, baseSpd: 4, sellPrice: 35, xpReward: 8, season: 'summer' },
  { animalId: 'palm_monkey', name: 'Palmiye Maymunu', emoji: '🐵', rarity: 'rare', baseHp: 100, baseStr: 14, baseDef: 10, baseSpd: 18, sellPrice: 150, xpReward: 35, season: 'summer' },
  { animalId: 'wave_dolphin', name: 'Dalga Yunusu', emoji: '🐬', rarity: 'rare', baseHp: 110, baseStr: 15, baseDef: 12, baseSpd: 22, sellPrice: 150, xpReward: 35, season: 'summer' },
  { animalId: 'volcano_salamander', name: 'Volkan Semenderi', emoji: '🔥', rarity: 'epic', baseHp: 180, baseStr: 28, baseDef: 22, baseSpd: 18, sellPrice: 700, xpReward: 150, season: 'summer' },
  { animalId: 'desert_scorpion', name: 'Çöl Akrebi', emoji: '🦂', rarity: 'epic', baseHp: 150, baseStr: 32, baseDef: 20, baseSpd: 16, sellPrice: 700, xpReward: 150, season: 'summer' },
  { animalId: 'solar_eagle', name: 'Güneş Kartalı', emoji: '🦅', rarity: 'legendary', baseHp: 300, baseStr: 45, baseDef: 28, baseSpd: 38, sellPrice: 3000, xpReward: 600, season: 'summer' },
  { animalId: 'fire_lord', name: 'Ateş Lordu', emoji: '🔥', rarity: 'mythic', baseHp: 580, baseStr: 65, baseDef: 48, baseSpd: 42, sellPrice: 12000, xpReward: 2500, season: 'summer' },
  { animalId: 'summer_emperor', name: 'Yaz İmparatoru', emoji: '☀️', rarity: 'hidden', baseHp: 850, baseStr: 88, baseDef: 72, baseSpd: 70, sellPrice: 120000, xpReward: 12000, season: 'summer' },

  // FALL ANIMALS (September, October, November) - Sonbahar Hayvanları
  { animalId: 'maple_squirrel', name: 'Akçaağaç Sincabı', emoji: '🐿️', rarity: 'common', baseHp: 60, baseStr: 7, baseDef: 6, baseSpd: 18, sellPrice: 10, xpReward: 2, season: 'fall' },
  { animalId: 'harvest_mouse', name: 'Hasat Faresi', emoji: '🐭', rarity: 'common', baseHp: 45, baseStr: 5, baseDef: 5, baseSpd: 20, sellPrice: 10, xpReward: 2, season: 'fall' },
  { animalId: 'pumpkin_cat', name: 'Balkabağı Kedisi', emoji: '🎃', rarity: 'common', baseHp: 75, baseStr: 9, baseDef: 8, baseSpd: 14, sellPrice: 10, xpReward: 2, season: 'fall' },
  { animalId: 'autumn_owl', name: 'Sonbahar Baykuşu', emoji: '🦉', rarity: 'uncommon', baseHp: 85, baseStr: 11, baseDef: 9, baseSpd: 14, sellPrice: 35, xpReward: 8, season: 'fall' },
  { animalId: 'forest_hedgehog', name: 'Orman Kirpisi', emoji: '🦔', rarity: 'uncommon', baseHp: 75, baseStr: 9, baseDef: 18, baseSpd: 10, sellPrice: 35, xpReward: 8, season: 'fall' },
  { animalId: 'golden_fox', name: 'Altın Tilki', emoji: '🦊', rarity: 'rare', baseHp: 100, baseStr: 15, baseDef: 12, baseSpd: 18, sellPrice: 150, xpReward: 35, season: 'fall' },
  { animalId: 'scarecrow_crow', name: 'Korkuluk Kargası', emoji: '🐦‍⬛', rarity: 'rare', baseHp: 80, baseStr: 13, baseDef: 10, baseSpd: 16, sellPrice: 150, xpReward: 35, season: 'fall' },
  { animalId: 'harvest_golem', name: 'Hasat Golemi', emoji: '🤖', rarity: 'epic', baseHp: 250, baseStr: 24, baseDef: 30, baseSpd: 8, sellPrice: 700, xpReward: 150, season: 'fall' },
  { animalId: 'ghost_wolf', name: 'Hayalet Kurt', emoji: '🐺', rarity: 'epic', baseHp: 190, baseStr: 28, baseDef: 20, baseSpd: 22, sellPrice: 700, xpReward: 150, season: 'fall' },
  { animalId: 'moon_stag', name: 'Ay Geyiği', emoji: '🌙', rarity: 'legendary', baseHp: 340, baseStr: 40, baseDef: 35, baseSpd: 32, sellPrice: 3000, xpReward: 600, season: 'fall' },
  { animalId: 'twilight_dragon', name: 'Alacakaranlık Ejderhası', emoji: '🐲', rarity: 'mythic', baseHp: 600, baseStr: 62, baseDef: 52, baseSpd: 40, sellPrice: 12000, xpReward: 2500, season: 'fall' },
  { animalId: 'autumn_sovereign', name: 'Sonbahar Hükümdarı', emoji: '🍂', rarity: 'hidden', baseHp: 880, baseStr: 85, baseDef: 78, baseSpd: 65, sellPrice: 120000, xpReward: 12000, season: 'fall' },

  // WINTER ANIMALS (December, January, February) - Kış Hayvanları
  { animalId: 'snow_rabbit', name: 'Kar Tavşanı', emoji: '🐇', rarity: 'common', baseHp: 65, baseStr: 6, baseDef: 8, baseSpd: 17, sellPrice: 10, xpReward: 2, season: 'winter' },
  { animalId: 'ice_penguin', name: 'Buz Pengueni', emoji: '🐧', rarity: 'common', baseHp: 80, baseStr: 8, baseDef: 10, baseSpd: 12, sellPrice: 10, xpReward: 2, season: 'winter' },
  { animalId: 'frost_owl', name: 'Ayaz Baykuşu', emoji: '🦉', rarity: 'common', baseHp: 70, baseStr: 9, baseDef: 7, baseSpd: 14, sellPrice: 10, xpReward: 2, season: 'winter' },
  { animalId: 'arctic_fox', name: 'Kutup Tilkisi', emoji: '🦊', rarity: 'uncommon', baseHp: 85, baseStr: 12, baseDef: 10, baseSpd: 16, sellPrice: 35, xpReward: 8, season: 'winter' },
  { animalId: 'snow_leopard', name: 'Kar Leoparı', emoji: '🐆', rarity: 'uncommon', baseHp: 110, baseStr: 16, baseDef: 12, baseSpd: 18, sellPrice: 35, xpReward: 8, season: 'winter' },
  { animalId: 'glacier_seal', name: 'Buzul Foku', emoji: '🦭', rarity: 'rare', baseHp: 130, baseStr: 12, baseDef: 18, baseSpd: 10, sellPrice: 150, xpReward: 35, season: 'winter' },
  { animalId: 'blizzard_wolf', name: 'Tipi Kurdu', emoji: '🐺', rarity: 'rare', baseHp: 120, baseStr: 18, baseDef: 14, baseSpd: 16, sellPrice: 150, xpReward: 35, season: 'winter' },
  { animalId: 'ice_golem', name: 'Buz Golemi', emoji: '🧊', rarity: 'epic', baseHp: 280, baseStr: 22, baseDef: 35, baseSpd: 6, sellPrice: 700, xpReward: 150, season: 'winter' },
  { animalId: 'frost_wyrm', name: 'Ayaz Solucanı', emoji: '🐍', rarity: 'epic', baseHp: 200, baseStr: 30, baseDef: 24, baseSpd: 14, sellPrice: 700, xpReward: 150, season: 'winter' },
  { animalId: 'northern_aurora', name: 'Kuzey Aurorası', emoji: '🌌', rarity: 'legendary', baseHp: 360, baseStr: 38, baseDef: 40, baseSpd: 28, sellPrice: 3000, xpReward: 600, season: 'winter' },
  { animalId: 'ice_titan', name: 'Buz Titanı', emoji: '❄️', rarity: 'mythic', baseHp: 620, baseStr: 56, baseDef: 60, baseSpd: 30, sellPrice: 12000, xpReward: 2500, season: 'winter' },
  { animalId: 'winter_monarch', name: 'Kış Kralı', emoji: '👑', rarity: 'hidden', baseHp: 900, baseStr: 80, baseDef: 85, baseSpd: 58, sellPrice: 120000, xpReward: 12000, season: 'winter' }
];

const weapons = [
  { weaponId: 'wooden_sword', name: 'Tahta Kılıç', emoji: '🗡️', type: 'physical', damage: 10, specialEffect: null, specialValue: null, price: 100, rarity: 'common' },
  { weaponId: 'iron_sword', name: 'Demir Kılıç', emoji: '⚔️', type: 'physical', damage: 25, specialEffect: null, specialValue: null, price: 500, rarity: 'common' },
  { weaponId: 'steel_dagger', name: 'Çelik Hançer', emoji: '🔪', type: 'physical', damage: 15, specialEffect: 'critical', specialValue: 10, price: 400, rarity: 'uncommon' },
  { weaponId: 'longbow', name: 'Uzun Yay', emoji: '🏹', type: 'physical', damage: 20, specialEffect: 'first_strike', specialValue: 100, price: 600, rarity: 'uncommon' },
  { weaponId: 'magic_wand', name: 'Büyü Asası', emoji: '🪄', type: 'magic', damage: 30, specialEffect: 'magic_boost', specialValue: 20, price: 1000, rarity: 'rare' },
  { weaponId: 'lightning_whip', name: 'Şimşek Kamçısı', emoji: '⚡', type: 'magic', damage: 40, specialEffect: 'stun', specialValue: 15, price: 2500, rarity: 'rare' },
  { weaponId: 'fire_sword', name: 'Ateş Kılıcı', emoji: '🔥', type: 'physical', damage: 50, specialEffect: 'burn', specialValue: 10, price: 5000, rarity: 'epic' },
  { weaponId: 'ice_axe', name: 'Buz Baltası', emoji: '❄️', type: 'physical', damage: 55, specialEffect: 'slow', specialValue: 20, price: 5500, rarity: 'epic' },
  { weaponId: 'dark_scythe', name: 'Karanlık Orak', emoji: '💀', type: 'physical', damage: 70, specialEffect: 'lifesteal', specialValue: 10, price: 10000, rarity: 'legendary' },
  { weaponId: 'dragon_sword', name: 'Ejderha Kılıcı', emoji: '👑', type: 'physical', damage: 100, specialEffect: 'all_stats', specialValue: 5, price: 50000, rarity: 'mythic' }
];

const armors = [
  { armorId: 'cloth_armor', name: 'Kumaş Zırh', emoji: '🥋', defense: 5, specialEffect: null, specialValue: null, price: 100, rarity: 'common' },
  { armorId: 'leather_armor', name: 'Deri Zırh', emoji: '🦺', defense: 15, specialEffect: null, specialValue: null, price: 400, rarity: 'common' },
  { armorId: 'chain_armor', name: 'Zincir Zırh', emoji: '🛡️', defense: 30, specialEffect: null, specialValue: null, price: 1000, rarity: 'uncommon' },
  { armorId: 'steel_armor', name: 'Çelik Zırh', emoji: '⚔️', defense: 50, specialEffect: null, specialValue: null, price: 3000, rarity: 'rare' },
  { armorId: 'fire_armor', name: 'Ateş Zırhı', emoji: '🔥', defense: 60, specialEffect: 'fire_resist', specialValue: 30, price: 8000, rarity: 'epic' },
  { armorId: 'ice_armor', name: 'Buz Zırhı', emoji: '❄️', defense: 60, specialEffect: 'ice_resist', specialValue: 30, price: 8000, rarity: 'epic' },
  { armorId: 'diamond_armor', name: 'Elmas Zırh', emoji: '💎', defense: 80, specialEffect: 'hp_boost', specialValue: 10, price: 20000, rarity: 'legendary' },
  { armorId: 'dragon_armor', name: 'Ejderha Zırhı', emoji: '👑', defense: 100, specialEffect: 'all_resist', specialValue: 20, price: 50000, rarity: 'mythic' }
];

const accessories = [
  { accessoryId: 'luck_ring', name: 'Şans Yüzüğü', emoji: '💍', effect: 'hunt_bonus', effectValue: 5, price: 2000, rarity: 'uncommon' },
  { accessoryId: 'power_necklace', name: 'Güç Kolyesi', emoji: '📿', effect: 'str_boost', effectValue: 10, price: 3000, rarity: 'rare' },
  { accessoryId: 'protection_talisman', name: 'Koruma Tılsımı', emoji: '🧿', effect: 'def_boost', effectValue: 10, price: 3000, rarity: 'rare' },
  { accessoryId: 'speed_bracelet', name: 'Hız Bileziği', emoji: '⏱️', effect: 'spd_boost', effectValue: 10, price: 3000, rarity: 'rare' },
  { accessoryId: 'magic_earring', name: 'Büyü Küpesi', emoji: '🔮', effect: 'magic_boost', effectValue: 15, price: 5000, rarity: 'epic' },
  { accessoryId: 'kings_crown', name: 'Kralın Tacı', emoji: '👑', effect: 'all_stats', effectValue: 5, price: 25000, rarity: 'legendary' }
];

const consumables = [
  { consumableId: 'small_hp_potion', name: 'Küçük Can İksiri', emoji: '❤️', effect: 'heal', effectValue: 50, duration: null, durationType: null, price: 50, rarity: 'common' },
  { consumableId: 'large_hp_potion', name: 'Büyük Can İksiri', emoji: '❤️‍🔥', effect: 'heal', effectValue: 200, duration: null, durationType: null, price: 200, rarity: 'uncommon' },
  { consumableId: 'str_potion', name: 'Güç İksiri', emoji: '💪', effect: 'str_boost', effectValue: 20, duration: 10, durationType: 'battles', price: 300, rarity: 'uncommon' },
  { consumableId: 'def_potion', name: 'Savunma İksiri', emoji: '🛡️', effect: 'def_boost', effectValue: 20, duration: 10, durationType: 'battles', price: 300, rarity: 'uncommon' },
  { consumableId: 'spd_potion', name: 'Hız İksiri', emoji: '⚡', effect: 'spd_boost', effectValue: 20, duration: 10, durationType: 'battles', price: 300, rarity: 'uncommon' },
  { consumableId: 'luck_potion', name: 'Şans İksiri', emoji: '🍀', effect: 'luck_boost', effectValue: 20, duration: 10, durationType: 'hunts', price: 500, rarity: 'rare' },
  { consumableId: 'rare_hunt_potion', name: 'Nadir Av İksiri', emoji: '✨', effect: 'rare_boost', effectValue: 100, duration: 5, durationType: 'hunts', price: 1000, rarity: 'epic' },
  { consumableId: 'xp_potion', name: 'XP İksiri', emoji: '🌟', effect: 'xp_boost', effectValue: 100, duration: 30, durationType: 'minutes', price: 800, rarity: 'rare' },
  { consumableId: 'money_potion', name: 'Para İksiri', emoji: '💰', effect: 'money_boost', effectValue: 100, duration: 30, durationType: 'minutes', price: 1500, rarity: 'epic' }
];

const baits = [
  { baitId: 'normal_bait', name: 'Normal Yem', emoji: '🍖', catchBonus: 5, rarityBonus: null, uses: 10, price: 100 },
  { baitId: 'quality_bait', name: 'Kaliteli Yem', emoji: '🥩', catchBonus: 10, rarityBonus: null, uses: 10, price: 300 },
  { baitId: 'premium_bait', name: 'Premium Yem', emoji: '🍗', catchBonus: 20, rarityBonus: null, uses: 10, price: 800 },
  { baitId: 'golden_bait', name: 'Altın Yem', emoji: '🦴', catchBonus: 30, rarityBonus: 'rare', uses: 5, price: 2000 },
  { baitId: 'diamond_bait', name: 'Elmas Yem', emoji: '💎', catchBonus: 50, rarityBonus: 'epic', uses: 3, price: 5000 }
];

const crates = [
  { crateId: 'bronze_crate', name: 'Bronz Sandık', emoji: '📦', minRarity: 'common', maxRarity: 'rare', price: 200 },
  { crateId: 'silver_crate', name: 'Gümüş Sandık', emoji: '📦', minRarity: 'uncommon', maxRarity: 'epic', price: 1000 },
  { crateId: 'gold_crate', name: 'Altın Sandık', emoji: '📦', minRarity: 'rare', maxRarity: 'legendary', price: 5000 },
  { crateId: 'diamond_crate', name: 'Elmas Sandık', emoji: '📦', minRarity: 'epic', maxRarity: 'mythic', price: 20000 },
  { crateId: 'cosmic_crate', name: 'Kozmik Sandık', emoji: '📦', minRarity: 'legendary', maxRarity: 'hidden', price: 100000 }
];

const bosses = [
  { bossId: 'young_dragon', name: 'Genç Ejderha', emoji: '🐲', hp: 1000, str: 50, def: 30, rewardMoney: 500, rewardRarity: 'rare' },
  { bossId: 'giant_kraken', name: 'Dev Kraken', emoji: '🦑', hp: 2500, str: 70, def: 50, rewardMoney: 1500, rewardRarity: 'epic' },
  { bossId: 'skeleton_king', name: 'İskelet Kral', emoji: '💀', hp: 5000, str: 100, def: 80, rewardMoney: 3000, rewardRarity: 'legendary' },
  { bossId: 'demon_lord', name: 'Şeytan Lord', emoji: '👹', hp: 10000, str: 150, def: 120, rewardMoney: 10000, rewardRarity: 'mythic' },
  { bossId: 'chaos_dragon', name: 'Kaos Ejderhası', emoji: '🌌', hp: 25000, str: 200, def: 180, rewardMoney: 50000, rewardRarity: 'hidden' }
];

const achievements = [
  // --- Avcılık Başarımları (Hunts) ---
  { achievementId: 'first_hunt', name: 'İlk Av', description: '1 hayvan yakala', emoji: '🎯', requirement: 'hunts', requirementValue: 1, rewardMoney: 50, rewardXp: 10 },
  { achievementId: 'hunter', name: 'Avcı', description: '100 hayvan yakala', emoji: '🏹', requirement: 'hunts', requirementValue: 100, rewardMoney: 1000, rewardXp: 250 },
  { achievementId: 'expert_hunter', name: 'Uzman Avcı', description: '500 hayvan yakala', emoji: '🎯', requirement: 'hunts', requirementValue: 500, rewardMoney: 5000, rewardXp: 1000 },
  { achievementId: 'master_hunter', name: 'Usta Avcı', description: '1000 hayvan yakala', emoji: '👑', requirement: 'hunts', requirementValue: 1000, rewardMoney: 15000, rewardXp: 2500 },
  { achievementId: 'legendary_hunter', name: 'Efsanevi Avcı', description: '5000 hayvan yakala', emoji: '🌌', requirement: 'hunts', requirementValue: 5000, rewardMoney: 50000, rewardXp: 10000 },

  // --- Savaş Başarımları (Battles Won) ---
  { achievementId: 'first_victory', name: 'İlk Zafer', description: '1 savaş kazan', emoji: '⚔️', requirement: 'battles_won', requirementValue: 1, rewardMoney: 100, rewardXp: 25 },
  { achievementId: 'warrior', name: 'Savaşçı', description: '50 savaş kazan', emoji: '🛡️', requirement: 'battles_won', requirementValue: 50, rewardMoney: 2000, rewardXp: 500 },
  { achievementId: 'gladiator', name: 'Gladyatör', description: '200 savaş kazan', emoji: '⚔️', requirement: 'battles_won', requirementValue: 200, rewardMoney: 10000, rewardXp: 2000 },
  { achievementId: 'warlord', name: 'Savaş Lordu', description: '500 savaş kazan', emoji: '🩸', requirement: 'battles_won', requirementValue: 500, rewardMoney: 25000, rewardXp: 5000 },

  // --- Ekonomi Başarımları (Balance) ---
  { achievementId: 'wealthy', name: 'Varlıklı', description: '10,000 Altın biriktir', emoji: '💰', requirement: 'balance', requirementValue: 10000, rewardMoney: 1000, rewardXp: 100 },
  { achievementId: 'rich', name: 'Zengin', description: '100,000 Altın biriktir', emoji: '💎', requirement: 'balance', requirementValue: 100000, rewardMoney: 5000, rewardXp: 500 },
  { achievementId: 'millionaire', name: 'Milyoner', description: '1,000,000 Altın biriktir', emoji: '🏦', requirement: 'balance', requirementValue: 1000000, rewardMoney: 50000, rewardXp: 5000 },
  { achievementId: 'billionaire', name: 'Milyarder', description: '5,000,000 Altın biriktir', emoji: '🐳', requirement: 'balance', requirementValue: 5000000, rewardMoney: 250000, rewardXp: 25000 },

  // --- Seviye Başarımları (Level) ---
  { achievementId: 'level_5', name: 'Yeni Başlayan', description: 'Seviye 5\'e ulaş', emoji: '⭐', requirement: 'level', requirementValue: 5, rewardMoney: 1000, rewardXp: 0 },
  { achievementId: 'level_10', name: 'Maceracı', description: 'Seviye 10\'a ulaş', emoji: '🌟', requirement: 'level', requirementValue: 10, rewardMoney: 3000, rewardXp: 0 },
  { achievementId: 'level_25', name: 'Deneyimli', description: 'Seviye 25\'e ulaş', emoji: '✨', requirement: 'level', requirementValue: 25, rewardMoney: 10000, rewardXp: 0 },
  { achievementId: 'level_50', name: 'Usta', description: 'Seviye 50\'ye ulaş', emoji: '🔥', requirement: 'level', requirementValue: 50, rewardMoney: 50000, rewardXp: 0 },
  { achievementId: 'level_100', name: 'Yarı Tanrı', description: 'Seviye 100\'e ulaş', emoji: '⚡', requirement: 'level', requirementValue: 100, rewardMoney: 250000, rewardXp: 0 },

  // --- Boss Başarımları (Boss Kills) ---
  { achievementId: 'dragon_slayer', name: 'Ejderha Avcısı', description: 'İlk Bossunu öldür', emoji: '🐉', requirement: 'bosses_killed', requirementValue: 1, rewardMoney: 5000, rewardXp: 500 },
  { achievementId: 'boss_hunter', name: 'Boss Avcısı', description: '10 Boss öldür', emoji: '⚔️', requirement: 'bosses_killed', requirementValue: 10, rewardMoney: 25000, rewardXp: 2000 },
  { achievementId: 'boss_slayer', name: 'Boss Katili', description: '50 Boss öldür', emoji: '☠️', requirement: 'bosses_killed', requirementValue: 50, rewardMoney: 100000, rewardXp: 10000 },

  // --- Koleksiyon & Biyom Başarımları (Regions Collection) ---
  { achievementId: 'collector', name: 'Hayvan Koleksiyoncusu', description: '10 farklı tür hayvan topla', emoji: '🦁', requirement: 'collection', requirementValue: 10, rewardMoney: 5000, rewardXp: 1000 },
  { achievementId: 'master_collector', name: 'Usta Koleksiyoncu', description: '50 farklı tür hayvan topla', emoji: '🐘', requirement: 'collection', requirementValue: 50, rewardMoney: 50000, rewardXp: 5000 },
  { achievementId: 'forest_explorer', name: 'Orman Kâşifi', description: 'Ormanda 10 hayvan topla', emoji: '🌲', requirement: 'region_forest', requirementValue: 10, rewardMoney: 2000, rewardXp: 500 },
  { achievementId: 'desert_explorer', name: 'Çöl Kâşifi', description: 'Çölde 10 hayvan topla', emoji: '🏜️', requirement: 'region_desert', requirementValue: 10, rewardMoney: 3000, rewardXp: 800 },
  { achievementId: 'ocean_explorer', name: 'Okyanus Kâşifi', description: 'Okyanusta 10 hayvan topla', emoji: '🌊', requirement: 'region_ocean', requirementValue: 10, rewardMoney: 4000, rewardXp: 1000 },
  { achievementId: 'mountain_explorer', name: 'Buzul Kâşifi', description: 'Dağlarda 10 hayvan topla', emoji: '⛰️', requirement: 'region_mountain', requirementValue: 10, rewardMoney: 5000, rewardXp: 1200 },
  { achievementId: 'volcano_explorer', name: 'Volkan Kâşifi', description: 'Volkanda 5 hayvan topla', emoji: '🌋', requirement: 'region_volcano', requirementValue: 5, rewardMoney: 10000, rewardXp: 2500 },
  { achievementId: 'void_explorer', name: 'Boşluk Kâşifi', description: 'Void(Boşluk) 5 hayvan topla', emoji: '🌌', requirement: 'region_void', requirementValue: 5, rewardMoney: 25000, rewardXp: 5000 }
];

const regions = [
  { id: 'forest', name: 'Zümrüt Ormanı', description: 'Başlangıç bölgesi, yeşilliklerle dolu huzurlu bir orman.', emoji: '🌲', requiredLevel: 1, energyCost: 10, isEventRegion: false },
  { id: 'desert', name: 'Kızgın Çöl', description: 'Sıcak ve tehlikeli kum tepeleri. Çöl canlılarına ev sahipliği yapar.', emoji: '🏜️', requiredLevel: 5, energyCost: 15, isEventRegion: false },
  { id: 'ocean', name: 'Derin Okyanus', description: 'Uçsuz bucaksız denizler. Su altı canavarlarıyla dolu.', emoji: '🌊', requiredLevel: 10, energyCost: 20, isEventRegion: false },
  { id: 'mountain', name: 'Buzul Dağları', description: 'Dondurucu soğuk ve dik yamaçlar. Uçan ve dayanıklı hayvanlar burada.', emoji: '⛰️', requiredLevel: 15, energyCost: 25, isEventRegion: false },
  { id: 'volcano', name: 'Ateş Dağı', description: 'Lavlarla kaplı tehlikeli bölge. Sadece en korkusuzlar girebilir.', emoji: '🌋', requiredLevel: 25, energyCost: 35, isEventRegion: false },
  { id: 'void', name: 'Hiçlik Boyutu', description: 'Zamanın ve mekanın ötesi. Kayıp ruhlar ve gizli varlıklar burada.', emoji: '🌌', requiredLevel: 40, energyCost: 50, isEventRegion: false }
];

// Season utility functions
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter'; // Dec, Jan, Feb
}

function getSeasonInfo(season) {
  const seasons = {
    spring: { name: 'Bahar', emoji: '🌸', months: 'Mart - Mayıs', color: '#90EE90' },
    summer: { name: 'Yaz', emoji: '☀️', months: 'Haziran - Ağustos', color: '#FFD700' },
    fall: { name: 'Sonbahar', emoji: '🍂', months: 'Eylül - Kasım', color: '#D2691E' },
    winter: { name: 'Kış', emoji: '❄️', months: 'Aralık - Şubat', color: '#87CEEB' }
  };
  return seasons[season] || seasons.winter;
}

function getSeasonalAnimalsForCurrentSeason() {
  const currentSeason = getCurrentSeason();
  return seasonalAnimals.filter(a => a.season === currentSeason);
}

function getAllAnimalsIncludingSeasonal(includeCurrentSeasonOnly = true) {
  if (includeCurrentSeasonOnly) {
    const currentSeasonAnimals = getSeasonalAnimalsForCurrentSeason();
    return [...animals, ...currentSeasonAnimals];
  }
  return [...animals, ...seasonalAnimals];
}

// === PHASE 7: MACERA MODU NPC'LERİ ===
const adventureNpcs = [
  { regionId: 'forest', name: 'Yaşlı Bilge', emoji: '🧙‍♂️', dialog: 'Hoş geldin gezgin... Ormanın derinliklerinde sırlar saklı.' },
  { regionId: 'desert', name: 'Tüccar Ali', emoji: '👳🏾‍♂️', dialog: 'Güneş tepede kavuruyor, gel gölgeye geç! İyi mallarım var.' },
  { regionId: 'ocean', name: 'Kaptan Jack', emoji: '🏴‍☠️', dialog: 'Yelkenler fora! Denizlerin fatihi olmak kolay değildir.' },
  { regionId: 'mountain', name: 'Zirve Gözcüsü', emoji: '🏔️', dialog: 'Buralar çok soğuk... Nefesini idareli kullanmalısın.' },
  { regionId: 'volcano', name: 'Kızıl Şaman', emoji: '🔥', dialog: 'Lavlar ruhunu arındıracak... Ya da seni küle çevirecek!' },
  { regionId: 'void', name: 'Kayıp Ruh', emoji: '👻', dialog: '...Zaman burada akmıyor... ...Seni bekliyordum...' }
];

module.exports = {
  animals,
  seasonalAnimals,
  weapons,
  armors,
  accessories,
  consumables,
  baits,
  crates,
  bosses,
  achievements,
  regions,
  adventureNpcs,
  getCurrentSeason,
  getSeasonInfo,
  getSeasonalAnimalsForCurrentSeason,
  getAllAnimalsIncludingSeasonal
};

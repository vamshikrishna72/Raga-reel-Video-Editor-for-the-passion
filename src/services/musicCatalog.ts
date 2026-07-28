export interface Song {
  id: string;
  title: string;
  artist: string;
  language: string;
  mood: string;
  thumbnail: string;
  isTrending?: boolean;
  previewUrl?: string;
}

export const musicCatalog: Song[] = [
  // TELUGU (15 songs)
  { id: 'telugu_naatu', title: 'Naatu Naatu', artist: 'M. M. Keeravani, Rahul Sipligunj', language: 'Telugu', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/naatu/80/80', isTrending: true },
  { id: 'telugu_samaja', title: 'Samajavaragamana', artist: 'Sid Sriram, Thaman S', language: 'Telugu', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/samaja/80/80' },
  { id: 'telugu_srivalli', title: 'Srivalli', artist: 'Sid Sriram, Devi Sri Prasad', language: 'Telugu', mood: 'Travel', thumbnail: 'https://picsum.photos/seed/srivalli/80/80' },
  { id: 'telugu_fear', title: 'Fear Song (Devara)', artist: 'Anirudh Ravichander', language: 'Telugu', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/fear/80/80', isTrending: true },
  { id: 'telugu_orendu', title: 'O Rendu Prema Meghalu', artist: 'Sreerama Chandra', language: 'Telugu', mood: 'Emotional', thumbnail: 'https://picsum.photos/seed/orendu/80/80' },
  { id: 'telugu_adiga', title: 'Adigaa', artist: 'Sid Sriram, Gopi Sundar', language: 'Telugu', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/adiga/80/80' },
  { id: 'telugu_nuvve', title: 'Nuvve Nuvve', artist: 'K. S. Chithra, Koti', language: 'Telugu', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/nuvve/80/80' },
  { id: 'telugu_dum_masala', title: 'Dum Masala', artist: 'San jith Hegde, Thaman S', language: 'Telugu', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/dum/80/80', isTrending: true },
  { id: 'telugu_kurchi', title: 'Kurchi Madathapetti', artist: 'Sri Krishna, Sahithi, Thaman S', language: 'Telugu', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/kurchi/80/80', isTrending: true },
  { id: 'telugu_bhairava', title: 'Bhairava Anthem', artist: 'Diljit Dosanjh, Sanjith Hegde', language: 'Telugu', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/bhairava/80/80', isTrending: true },
  { id: 'telugu_takkara', title: 'Ta Takkara', artist: 'Arijit Singh, Sanjith Hegde', language: 'Telugu', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/takkara/80/80' },
  { id: 'telugu_anjaneya', title: 'Sri Anjaneya (HanuMan)', artist: 'Sai Charan Bhaskaruni', language: 'Telugu', mood: 'Cinematic', thumbnail: 'https://picsum.photos/seed/anjaneya/80/80' },
  { id: 'telugu_dosti', title: 'Dosti (RRR)', artist: 'Hemachandra, M. M. Keeravani', language: 'Telugu', mood: 'Emotional', thumbnail: 'https://picsum.photos/seed/dosti/80/80' },
  { id: 'telugu_urike', title: 'Urike Urike', artist: 'Sid Sriram, Chinmayi', language: 'Telugu', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/urike/80/80' },
  { id: 'telugu_poongodhaye', title: 'Poongodhaye', artist: 'Sid Sriram', language: 'Telugu', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/poongodh/80/80' },

  // HINDI (12 songs)
  { id: 'hindi_kesariya', title: 'Kesariya', artist: 'Arijit Singh, Pritam', language: 'Hindi', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/kesariya/80/80', isTrending: true },
  { id: 'hindi_apna', title: 'Apna Bana Le', artist: 'Arijit Singh, Sachin-Jigar', language: 'Hindi', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/apna/80/80' },
  { id: 'hindi_zinda', title: 'Zinda', artist: 'Siddharth Mahadevan', language: 'Hindi', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/zinda/80/80' },
  { id: 'hindi_kabira', title: 'Kabira', artist: 'Tochi Raina, Rekha Bhardwaj', language: 'Hindi', mood: 'Emotional', thumbnail: 'https://picsum.photos/seed/kabira/80/80' },
  { id: 'hindi_fateh', title: 'Kar Har Maidaan Fateh', artist: 'Sukhwinder Singh, Shreya Ghoshal', language: 'Hindi', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/fateh/80/80' },
  { id: 'hindi_ghar', title: 'Ghar More Pardesiya', artist: 'Shreya Ghoshal, Pritam', language: 'Hindi', mood: 'Cinematic', thumbnail: 'https://picsum.photos/seed/ghar/80/80' },
  { id: 'hindi_chaleya', title: 'Chaleya (Jawan)', artist: 'Arijit Singh, Shilpa Rao, Anirudh', language: 'Hindi', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/chaleya/80/80', isTrending: true },
  { id: 'hindi_arjan', title: 'Arjan Vailly', artist: 'Bhupinder Babbal, Manan Bhardwaj', language: 'Hindi', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/arjan/80/80', isTrending: true },
  { id: 'hindi_pehle', title: 'Pehle Bhi Main', artist: 'Vishal Mishra', language: 'Hindi', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/pehle/80/80', isTrending: true },
  { id: 'hindi_satranga', title: 'Satranga', artist: 'Arijit Singh, Siddharth-Garima', language: 'Hindi', mood: 'Emotional', thumbnail: 'https://picsum.photos/seed/satranga/80/80' },
  { id: 'hindi_luttputt', title: 'Lutt Putt Gaya', artist: 'Arijit Singh, Pritam', language: 'Hindi', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/luttputt/80/80' },
  { id: 'hindi_heeriye', title: 'Heeriye', artist: 'Jasleen Royal, Arijit Singh', language: 'Hindi', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/heeriye/80/80', isTrending: true },

  // ENGLISH (12 songs)
  { id: 'english_blinding', title: 'Blinding Lights', artist: 'The Weeknd', language: 'English', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/blinding/80/80' },
  { id: 'english_shape', title: 'Shape of You', artist: 'Ed Sheeran', language: 'English', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/shape/80/80' },
  { id: 'english_stay', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', language: 'English', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/stay/80/80' },
  { id: 'english_perfect', title: 'Perfect', artist: 'Ed Sheeran', language: 'English', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/perfect/80/80' },
  { id: 'english_believer', title: 'Believer', artist: 'Imagine Dragons', language: 'English', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/believer/80/80' },
  { id: 'english_mockingbird', title: 'Mockingbird', artist: 'Eminem', language: 'English', mood: 'Emotional', thumbnail: 'https://picsum.photos/seed/mockingbird/80/80' },
  { id: 'english_asitwas', title: 'As It Was', artist: 'Harry Styles', language: 'English', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/asitwas/80/80', isTrending: true },
  { id: 'english_cruel', title: 'Cruel Summer', artist: 'Taylor Swift', language: 'English', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/cruel/80/80', isTrending: true },
  { id: 'english_flowers', title: 'Flowers', artist: 'Miley Cyrus', language: 'English', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/flowers/80/80' },
  { id: 'english_starboy', title: 'Starboy', artist: 'The Weeknd, Daft Punk', language: 'English', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/starboy/80/80' },
  { id: 'english_greedy', title: 'Greedy', artist: 'Tate McRae', language: 'English', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/greedy/80/80', isTrending: true },
  { id: 'english_losecontrol', title: 'Lose Control', artist: 'Teddy Swims', language: 'English', mood: 'Emotional', thumbnail: 'https://picsum.photos/seed/losecontrol/80/80', isTrending: true },

  // TAMIL (10 songs)
  { id: 'tamil_arabic', title: 'Arabic Kuthu', artist: 'Anirudh Ravichander, Jonita Gandhi', language: 'Tamil', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/arabic/80/80' },
  { id: 'tamil_naan', title: 'Naan Pizhai', artist: 'Anirudh Ravichander, Shashaa Tirupati', language: 'Tamil', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/naan/80/80' },
  { id: 'tamil_hukum', title: 'Hukum (Jailer)', artist: 'Anirudh Ravichander', language: 'Tamil', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/hukum/80/80', isTrending: true },
  { id: 'tamil_mehabooba', title: 'Mehabooba', artist: 'Ananya Bhat, Ravi Basrur', language: 'Tamil', mood: 'Emotional', thumbnail: 'https://picsum.photos/seed/meha/80/80' },
  { id: 'tamil_kaavaalaa', title: 'Kaavaalaa', artist: 'Anirudh Ravichander, Shilpa Rao', language: 'Tamil', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/kaavaa/80/80', isTrending: true },
  { id: 'tamil_badass', title: 'Badass (Leo)', artist: 'Anirudh Ravichander', language: 'Tamil', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/badass/80/80', isTrending: true },
  { id: 'tamil_naaready', title: 'Naa Ready', artist: 'Thalapathy Vijay, Anirudh', language: 'Tamil', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/naaready/80/80', isTrending: true },
  { id: 'tamil_ordinary', title: 'Ordinary Person', artist: 'Anirudh Ravichander', language: 'Tamil', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/ordinary/80/80' },
  { id: 'tamil_vikram', title: 'Vikram Title Track', artist: 'Anirudh Ravichander', language: 'Tamil', mood: 'Cinematic', thumbnail: 'https://picsum.photos/seed/vikram/80/80' },
  { id: 'tamil_pathala', title: 'Pathala Pathala', artist: 'Kamal Haasan, Anirudh', language: 'Tamil', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/pathala/80/80' },

  // PUNJABI (8 songs)
  { id: 'punjabi_295', title: '295', artist: 'Sidhu Moose Wala', language: 'Punjabi', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/295/80/80', isTrending: true },
  { id: 'punjabi_brown', title: 'Brown Munde', artist: 'AP Dhillon, Gurinder Gill', language: 'Punjabi', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/brown/80/80' },
  { id: 'punjabi_excuses', title: 'Excuses', artist: 'AP Dhillon, Intense', language: 'Punjabi', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/excuses/80/80', isTrending: true },
  { id: 'punjabi_miamor', title: 'Mi Amor', artist: 'Sharn', language: 'Punjabi', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/miamor/80/80' },
  { id: 'punjabi_wbb', title: 'White Brown Black', artist: 'Karan Aujla, Avvy Sra', language: 'Punjabi', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/wbb/80/80' },
  { id: 'punjabi_softly', title: 'Softly', artist: 'Karan Aujla', language: 'Punjabi', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/softly/80/80', isTrending: true },
  { id: 'punjabi_pasoori', title: 'Pasoori', artist: 'Ali Sethi, Shae Gill', language: 'Punjabi', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/pasoori/80/80' },
  { id: 'punjabi_cheques', title: 'Cheques', artist: 'Shubh', language: 'Punjabi', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/cheques/80/80', isTrending: true },

  // MALAYALAM (5 songs)
  { id: 'malayalam_darshana', title: 'Darshana', artist: 'Hesham Abdul Wahab', language: 'Malayalam', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/darshana/80/80' },
  { id: 'malayalam_manike', title: 'Manike Mage Hithe', artist: 'Yohani, Satheeshan', language: 'Malayalam', mood: 'Chill', thumbnail: 'https://picsum.photos/seed/manike/80/80' },
  { id: 'malayalam_kalaavathi', title: 'Kalaavathi Malayalam', artist: 'Sid Sriram', language: 'Malayalam', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/kalaa_m/80/80' },
  { id: 'malayalam_kudhukku', title: 'Kudhukku', artist: 'Vineeth Sreenivasan', language: 'Malayalam', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/kudhukku/80/80' },
  { id: 'malayalam_thallumaala', title: 'Thallumaala Theme', artist: 'Vishnu Vijay', language: 'Malayalam', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/thallu/80/80', isTrending: true },

  // KANNADA (5 songs)
  { id: 'kannada_singara', title: 'Singara Siriye', artist: 'Vijay Prakash, Ananya Bhat', language: 'Kannada', mood: 'Romantic', thumbnail: 'https://picsum.photos/seed/singara/80/80' },
  { id: 'kannada_rakkamma', title: 'Ra Ra Rakkamma', artist: 'Sunidhi Chauhan, Nakash Aziz', language: 'Kannada', mood: 'Hype', thumbnail: 'https://picsum.photos/seed/rakkamma/80/80', isTrending: true },
  { id: 'kannada_salam', title: 'Salam Rocky Bhai', artist: 'Vijay Prakash, Ravi Basrur', language: 'Kannada', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/salam/80/80' },
  { id: 'kannada_toofan', title: 'Toofan (KGF 2)', artist: 'Ravi Basrur', language: 'Kannada', mood: 'Motivation', thumbnail: 'https://picsum.photos/seed/toofan/80/80', isTrending: true },
  { id: 'kannada_kgftheme', title: 'KGF Theme', artist: 'Ravi Basrur', language: 'Kannada', mood: 'Cinematic', thumbnail: 'https://picsum.photos/seed/kgf/80/80' }
];

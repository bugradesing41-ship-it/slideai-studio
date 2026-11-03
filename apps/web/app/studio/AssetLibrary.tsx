"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Sparkles } from "lucide-react";

export type StudioAsset = { id: string; label: string; symbol: string; category: string; keywords: string; imageUrl?: string; fontFamily?: string; source?: string; animated?: boolean };

const ASSETS: StudioAsset[] = [
  ...[["😀","Happy face"],["😎","Cool face"],["🤩","Star eyes"],["🥳","Party face"],["🤔","Thinking face"],["😴","Sleepy face"],["😮","Surprised face"],["🥹","Touched face"],["😇","Angel face"],["🤓","Nerd face"],["😏","Smirk face"],["😭","Crying face"],["😡","Angry face"],["🤯","Mind blown"],["🫡","Salute face"],["🤖","Friendly robot"],["👽","Alien"],["👻","Ghost"],["💀","Skull"],["🐱","Cat character"],["🐶","Dog character"],["🦊","Fox character"],["🐼","Panda character"],["🐸","Frog character"],["🐻","Bear character"],["🦄","Unicorn"],["🐙","Octopus"],["🦋","Butterfly"],["🐝","Bee character"],["🦖","Dinosaur"],["🧑‍🚀","Astronaut"],["🧑‍🎨","Artist"],["🧑‍💻","Developer"],["🧑‍🏫","Teacher"],["🧑‍🍳","Chef"],["🦸","Superhero"],["🧙","Wizard"],["🥷","Ninja"],["🧚","Fairy"],["🧜","Mermaid"]].map(([symbol,label],i)=>({id:"char-"+i,label,symbol,category:"Characters",keywords:"cartoon caricature sticker character face mascot"})),
  ...[["⭐","Star"],["✨","Sparkles"],["💫","Dizzy star"],["🔥","Fire"],["💡","Idea bulb"],["❤️","Heart"],["💜","Purple heart"],["💚","Green heart"],["⚡","Lightning"],["☀️","Sun"],["🌙","Moon"],["🌈","Rainbow"],["☁️","Cloud"],["❄️","Snowflake"],["🌊","Wave"],["🌸","Flower"],["🌻","Sunflower"],["🍀","Clover"],["🌵","Cactus"],["🌍","Earth"],["🌎","Earth globe"],["🌱","Seedling"],["🍃","Leaves"],["💧","Water drop"],["💎","Gem"],["🎯","Target"],["🏆","Trophy"],["🎖️","Medal"],["👑","Crown"],["🎁","Gift"],["🎈","Balloon"],["🎉","Confetti"],["🎊","Party popper"],["🪄","Magic wand"],["🧩","Puzzle"],["🛡️","Shield"],["🔑","Key"],["🔔","Bell"],["📌","Pin"]].map(([symbol,label],i)=>({id:"sym-"+i,label,symbol,category:"Symbols",keywords:"symbol icon decorative illustration"})),
  ...[["➡️","Right arrow"],["⬅️","Left arrow"],["⬆️","Up arrow"],["⬇️","Down arrow"],["↗️","North east"],["↘️","South east"],["↙️","South west"],["↖️","North west"],["🔀","Shuffle arrows"],["🔁","Repeat"],["➕","Plus"],["➖","Minus"],["✖️","Multiply"],["➗","Divide"],["✔️","Check"],["❌","Cross"],["⭕","Circle mark"],["🚫","Prohibited"],["⚠️","Warning"],["⛔","Stop"],["🚦","Traffic light"],["🛑","Stop sign"],["📍","Location pin"],["🧭","Compass"],["↔️","Horizontal arrows"],["↕️","Vertical arrows"],["🔼","Triangle up"],["🔽","Triangle down"],["▶️","Play"],["⏸️","Pause"]].map(([symbol,label],i)=>({id:"sign-"+i,label,symbol,category:"Signs & arrows",keywords:"sign marker arrow direction navigation status"})),
  ...[["🏷️","Price tag"],["🔖","Bookmark"],["📣","Megaphone"],["📢","Loudspeaker"],["💬","Speech bubble"],["🗨️","Chat bubble"],["💭","Thought bubble"],["🆕","New badge"],["🆒","Cool badge"],["🆓","Free badge"],["🔴","Red status"],["🟢","Green status"],["🟡","Yellow status"],["🔵","Blue status"],["🟣","Purple status"],["⚫","Black dot"],["🔘","Radio mark"],["💯","100 badge"],["🔝","Top badge"],["🏅","Award badge"],["🥇","First place"],["🥈","Second place"],["🥉","Third place"],["🚀","Launch badge"],["💥","Impact burst"],["❗","Exclamation"],["❓","Question"],["‼️","Double exclamation"],["⁉️","Surprise mark"],["♻️","Recycle"]].map(([symbol,label],i)=>({id:"badge-"+i,label,symbol,category:"Badges & labels",keywords:"badge label sticker award status callout"})),
  ...[["📊","Bar chart"],["📈","Growth chart"],["📉","Decline chart"],["🗓️","Calendar"],["📅","Date"],["⏱️","Stopwatch"],["⏰","Alarm"],["⌛","Hourglass"],["💰","Money bag"],["💵","Banknote"],["💳","Card"],["🪙","Coin"],["🧮","Abacus"],["🧾","Receipt"],["📦","Package"],["🛒","Cart"],["🏦","Bank"],["💹","Market chart"],["🧠","Brain"],["🎓","Graduation"],["📚","Books"],["✏️","Pencil"],["📝","Notes"],["🔬","Microscope"],["🧪","Test tube"],["⚙️","Settings"],["🔧","Wrench"],["🖥️","Desktop"],["📱","Phone"],["💻","Laptop"],["📡","Satellite"],["🔋","Battery"],["🔌","Plug"],["🌐","Globe web"],["🔒","Lock"],["🔓","Unlock"],["🛠️","Tools"],["🧰","Toolbox"]].map(([symbol,label],i)=>({id:"work-"+i,label,symbol,category:"Business & tech",keywords:"business technology education finance infographic"})),
  ...[["🏠","Home"],["🏢","Office"],["🏭","Factory"],["🏬","Store"],["🏥","Hospital"],["🏫","School"],["🏛️","Institution"],["🌆","City"],["🏙️","Skyline"],["🚗","Car"],["🚲","Bicycle"],["✈️","Airplane"],["🚀","Rocket"],["🚆","Train"],["🚢","Ship"],["🚌","Bus"],["🚁","Helicopter"],["🛸","UFO"],["🧳","Suitcase"],["🗺️","Map"],["⛺","Tent"],["🏕️","Camping"],["🏖️","Beach"],["⛰️","Mountain"],["🌋","Volcano"],["🌲","Pine tree"],["🌴","Palm tree"],["🌳","Tree"],["🏝️","Island"],["🌅","Sunrise"]].map(([symbol,label],i)=>({id:"world-"+i,label,symbol,category:"Places & travel",keywords:"place travel building city transport map"})),
  ...[["⚽","Football"],["🏀","Basketball"],["🏈","American football"],["⚾","Baseball"],["🎾","Tennis"],["🏐","Volleyball"],["🏓","Ping pong"],["🏸","Badminton"],["🥊","Boxing"],["🥋","Martial arts"],["🏋️","Weightlifting"],["🚴","Cycling"],["🏊","Swimming"],["🏃","Running"],["🧘","Yoga"],["🎮","Gaming"],["🎧","Headphones"],["🎵","Music"],["🎬","Film"],["📷","Camera"],["🎨","Art palette"],["🖌️","Paintbrush"],["🎤","Microphone"],["🎹","Piano"],["🎸","Guitar"],["🎭","Theatre"],["🎪","Circus"],["🎟️","Ticket"],["🎲","Dice"],["🧸","Toy"]].map(([symbol,label],i)=>({id:"life-"+i,label,symbol,category:"Lifestyle & hobbies",keywords:"sport music art entertainment hobby"}))
];
const CHARACTER_ART: StudioAsset[] = [
  ["groovy","Groovy dancer","groovy.svg","Dance & movement","dance music movement"],
  ["dog-jump","Person jumping with a dog","dog-jump.svg","Pets & play","dog pet jumping"],
  ["jumping","Jumping character","jumping.svg","Sports & movement","jumping celebration energy"],
  ["sprinting","Sprinter","sprinting.svg","Sports & movement","running sprint sport"],
  ["running","Runner","running.svg","Sports & movement","running fitness"],
  ["roller-skating","Roller skater","roller-skating.svg","Sports & movement","roller skating sport"],
  ["ballet","Ballet dancer","ballet.svg","Sports & movement","ballet dance"],
  ["moshing","Dancing to music","moshing.svg","Dance & movement","music dancing"],
  ["dancing","Free dancer","dancing.svg","Dance & movement","dance movement"],
  ["swinging","Swinging character","swinging.svg","Sports & movement","swing play"],
  ["rolling","Rolling character","rolling.svg","Sports & movement","rolling motion"],
  ["levitate","Levitating character","levitate.svg","Fantasy & expression","levitate floating"],
  ["float","Floating character","float.svg","Fantasy & expression","floating levitation"],
  ["zombieing","Zombie walk","zombieing.svg","Fantasy & expression","funny halloween"],
  ["selfie","Taking a selfie","selfie.svg","Everyday life","phone social media selfie"],
  ["chilling","Relaxed character","chilling.svg","Everyday life","relax sitting lifestyle"],
  ["laying","Using a phone","laying.svg","Everyday life","mobile phone technology"],
  ["strolling","Strolling character","strolling.svg","Everyday life","walking lifestyle"],
  ["sleek","Stylish walker","sleek.svg","Everyday life","fashion walking"],
  ["ice-cream","Ice cream lover","ice-cream.svg","Everyday life","food summer"],
  ["coffee","Coffee lover","coffee.svg","Everyday life","coffee cafe"],
  ["plant","Plant lover","plant.svg","Everyday life","plant nature eco"],
  ["loving","Holding a heart","loving.svg","Everyday life","love heart kindness"],
  ["unboxing","Surprise from a box","unboxing.svg","Everyday life","surprise delivery package"],
  ["clumsy","Papers flying","clumsy.svg","Work & study","work office papers"],
  ["reading","Reading a book","reading.svg","Work & study","reading book education"],
  ["reading-side","Reading on the floor","reading-side.svg","Work & study","book reading study"],
  ["sitting-reading","Sitting with a book","sitting-reading.svg","Work & study","book sitting education"],
  ["sitting","Sitting character","sitting.svg","Work & study","sitting thinking"],
  ["meditating","Meditating character","meditating.svg","Wellbeing","meditation calm mindfulness"],
  ["petting","Petting a dog","petting.svg","Pets & play","dog pet animal"],
].map(([id,label,file,category,keywords])=>({
  id:"open-doodles-"+id,
  label,
  symbol:"",
  category,
  imageUrl:"https://opendoodles.s3-us-west-1.amazonaws.com/"+file,
  source:"Open Doodles · Pablo Stanley · CC0",
  keywords
}));

const ANIMATED_CHARACTERS: StudioAsset[] = [
  ["doggie","Dog & friend","doggie.gif","animated dog character friendship"],
  ["levitate","Levitating character","levitate.gif","animated floating levitation"],
  ["sprinting","Sprint loop","sprinting.gif","animated running sprint"],
  ["coffee","Coffee break","coffee.gif","animated coffee break"],
].map(([id,label,file,keywords])=>({
  id:"open-doodles-gif-"+id,
  label,
  symbol:"",
  category:"Animated characters",
  imageUrl:"https://opendoodles.s3-us-west-1.amazonaws.com/"+file,
  animated:true,
  source:"Open Doodles · Pablo Stanley · CC0",
  keywords
}));

const GOOGLE_MATERIAL_ICONS = ["home","search","menu","close","settings","account_circle","person","group","groups","favorite","star","check_circle","info","warning","error","help","add","remove","delete","edit","download","upload","share","link","visibility","visibility_off","lock","lock_open","mail","phone","calendar_month","schedule","event","location_on","map","flight","directions_car","train","restaurant","shopping_cart","payments","credit_card","receipt_long","inventory_2","package_2","storefront","business","apartment","factory","school","menu_book","lightbulb","rocket_launch","trending_up","trending_down","bar_chart","pie_chart","analytics","query_stats","monitoring","savings","attach_money","currency_exchange","language","public","cloud","computer","smartphone","devices","wifi","bolt","eco","energy_savings_leaf","recycling","water_drop","health_and_safety","medical_services","science","biotech","psychology","palette","brush","design_services","photo_camera","image","videocam","play_circle","pause_circle","music_note","headphones","sports_soccer","fitness_center","self_improvement","celebration","emoji_events","workspace_premium","verified","shield","security","key","notifications","chat","forum","campaign","support_agent","schedule_send","task_alt","checklist","dashboard","view_kanban","layers","widgets","grid_view","view_carousel","slideshow","present_to_all","auto_awesome","magic_button","wand_stars","flare","animation","motion_photos_on","speed","timer","hourglass_empty","arrow_forward","arrow_back","arrow_upward","arrow_downward","north_east","south_east","expand_more","expand_less","refresh","sync","tune","filter_list","sort","more_horiz","more_vert","drag_indicator","open_in_new","fullscreen","fullscreen_exit","zoom_in","zoom_out","crop","rotate_right","flip","format_bold","format_italic","format_underlined","format_color_text","text_fields","title","notes","description","article","insert_chart","table_chart","data_object","code","terminal","api","database","cloud_upload","cloud_download","folder","folder_open","file_present","picture_as_pdf","attach_file","bookmark","label","sell","new_releases","thumb_up","thumb_down","sentiment_satisfied","pets","park","forest","beach_access","landscape","sunny","nightlight","wb_sunny","ac_unit","thermostat","local_cafe","local_mall","local_offer","local_shipping","delivery_dining","support","handshake","volunteer_activism","diversity_3","travel_explore","explore","anchor","sailing","directions_bike","directions_walk","directions_run","airport_shuttle","hotel","bed","chair","weekend","chair_alt","table_restaurant","coffee","cake","icecream","shopping_bag","redeem","diamond","currency_bitcoin","account_balance","monitor_heart","favorite_border"] .map((name,i)=>({id:"gmi-"+i,label:name.replace(/_/g," "),symbol:name,category:"Google Icons",imageUrl:"https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/"+name+"/default/24px.svg",keywords:"google material symbols icon glyph interface ui"}));

export function getPersistentCharacterAssetUrl(label:string,animated=false) { const preferred=animated?ANIMATED_CHARACTERS:CHARACTER_ART; const asset=preferred.find((item)=>item.label===label)??[...CHARACTER_ART,...ANIMATED_CHARACTERS].find((item)=>item.label===label); return asset?.imageUrl?"/api/assets/proxy?url="+encodeURIComponent(asset.imageUrl):undefined; }

const CATEGORIES=["All assets","Characters","Animated characters","Sports & movement","Dance & movement","Everyday life","Work & study","Pets & play","Fantasy & expression","Wellbeing","Google Icons","Symbols","Signs & arrows","Badges & labels","Business & tech","Places & travel","Lifestyle & hobbies"];

export default function AssetLibrary({onChoose,onClose,initialCategory="All assets"}:{onChoose:(asset:StudioAsset)=>void;onClose:()=>void;initialCategory?:string}) {
  const [category,setCategory]=useState(initialCategory);
  const [query,setQuery]=useState("");
  const [failedPreviews,setFailedPreviews]=useState<Record<string,boolean>>({});
  const [materialSymbolsReady,setMaterialSymbolsReady]=useState(false);
  useEffect(()=>{let cancelled=false;const load=async()=>{let link=document.getElementById("slideai-material-symbols-library") as HTMLLinkElement|null;if(!link){link=document.createElement("link");link.id="slideai-material-symbols-library";link.rel="stylesheet";link.href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";const loaded=new Promise<void>((resolve)=>{link!.addEventListener("load",()=>resolve(),{once:true});link!.addEventListener("error",()=>resolve(),{once:true});});document.head.appendChild(link);await loaded;}try{await document.fonts.load('34px "Material Symbols Outlined"',"home");await document.fonts.ready;}catch{}if(!cancelled)setMaterialSymbolsReady(document.fonts.check('34px "Material Symbols Outlined"',"home"));};void load();return()=>{cancelled=true;};},[]);
  const filtered=useMemo(()=>([...GOOGLE_MATERIAL_ICONS,...CHARACTER_ART,...ANIMATED_CHARACTERS,...ASSETS] as StudioAsset[]).filter(asset=>(category==="All assets"||(category==="Characters"?(asset.category==="Characters"||asset.id.startsWith("open-doodles-")):asset.category===category))&&(query.trim()===""||(asset.label+" "+asset.keywords+" "+asset.symbol).toLowerCase().includes(query.toLowerCase()))),[category,query]);
  return <div className="asset-library-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section className="asset-library" role="dialog" aria-modal="true" aria-label="Asset library">
      <header className="asset-library-header"><div><span className="asset-library-mark"><Sparkles size={16}/></span><div><strong>Asset library</strong><small>Icons, symbols and illustrations for your slides</small></div></div><button className="asset-close" onClick={onClose} aria-label="Close asset library"><X size={18}/></button></header>
      <div className="asset-search"><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search stickers, icons, arrows..." autoFocus/><kbd>⌘ K</kbd></div>
      <div className="asset-library-body"><nav className="asset-category-sidebar" aria-label="Asset categories">{CATEGORIES.map(item=><button key={item} className={category===item?"active":""} onClick={()=>setCategory(item)}><span>{item==="All assets"?"All assets":item}</span><small>{item==="All assets"?GOOGLE_MATERIAL_ICONS.length+CHARACTER_ART.length+ANIMATED_CHARACTERS.length+ASSETS.length:item==="Characters"?ASSETS.filter(asset=>asset.category==="Characters").length+CHARACTER_ART.length+ANIMATED_CHARACTERS.length:[...GOOGLE_MATERIAL_ICONS,...CHARACTER_ART,...ANIMATED_CHARACTERS,...ASSETS].filter(asset=>asset.category===item).length}</small></button>)}</nav><section className="asset-content"><div className="asset-results-head"><div><strong>{category}</strong><small>Choose an item to add it to your slide</small></div><span>{filtered.length} assets</span></div><div className="asset-grid">{filtered.map(asset=><button key={asset.id} className="asset-tile" title={asset.label} onClick={()=>onChoose(asset.imageUrl?{...asset,imageUrl:"/api/assets/proxy?url="+encodeURIComponent(asset.imageUrl)}:asset)}><span className={asset.imageUrl?"asset-character-preview":asset.fontFamily?"asset-symbol-preview":"asset-emoji-preview"}>{asset.imageUrl?(failedPreviews[asset.id]?<span className="asset-preview-fallback" aria-label="Preview unavailable">Preview unavailable</span>:<img src={"/api/assets/proxy?url="+encodeURIComponent(asset.imageUrl)} alt={asset.label} loading="lazy" onError={()=>setFailedPreviews(current=>({...current,[asset.id]:true}))}/>):(asset.fontFamily&&!materialSymbolsReady?"◇":asset.symbol)}{asset.animated&&<em className="asset-animation-badge">GIF · LIVE</em>}</span><small>{asset.label}</small></button>)}</div>{filtered.length===0&&<div className="asset-empty"><strong>No assets found</strong><span>Try another search term or category.</span></div>}</section></div>
      <footer className="asset-library-footer">Google Material Symbols · Apache 2.0. Open Doodles by Pablo Stanley · CC0. Animated GIF characters play on the canvas and can be included in PPTX exports.</footer>
    </section>
  </div>;
}

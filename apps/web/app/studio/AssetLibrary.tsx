"use client";

import { useMemo, useState } from "react";
import { Search, X, Sparkles } from "lucide-react";

export type StudioAsset = { id: string; label: string; symbol: string; category: string; keywords: string; imageUrl?: string; source?: string };

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
  ["jumping","Jumping character","https://opendoodles.s3-us-west-1.amazonaws.com/jumping.svg","energetic jump action celebration"],
  ["selfie","Taking a selfie","https://opendoodles.s3-us-west-1.amazonaws.com/selfie.svg","phone social media selfie"],
  ["dancing","Dancing character","https://opendoodles.s3-us-west-1.amazonaws.com/dancing.svg","dance music movement"],
  ["chilling","Relaxed character","https://opendoodles.s3-us-west-1.amazonaws.com/chilling.svg","relax sitting lifestyle"],
  ["laying","Using a phone","https://opendoodles.s3-us-west-1.amazonaws.com/laying.svg","mobile phone technology"],
  ["sprinting","Running character","https://opendoodles.s3-us-west-1.amazonaws.com/sprinting.svg","running speed sport"],
  ["zombieing","Funny zombie","https://opendoodles.s3-us-west-1.amazonaws.com/zombieing.svg","funny halloween"],
  ["Doggie","Person with a dog","https://opendoodles.s3-us-west-1.amazonaws.com/Doggie.svg","dog pet animal"],
  ["sitting","Sitting character","https://opendoodles.s3-us-west-1.amazonaws.com/sitting.svg","sitting thinking"],
  ["floating","Floating character","https://opendoodles.s3-us-west-1.amazonaws.com/floating.svg","floating levitating"],
  ["reading","Reading character","https://opendoodles.s3-us-west-1.amazonaws.com/reading.svg","reading book education"],
  ["plant","Plant lover","https://opendoodles.s3-us-west-1.amazonaws.com/plant.svg","plant nature eco"],
  ["walking","Walking character","https://opendoodles.s3-us-west-1.amazonaws.com/walking.svg","walking lifestyle"],
  ["swing","Swinging character","https://opendoodles.s3-us-west-1.amazonaws.com/swing.svg","swing play"],
  ["falling","Falling with papers","https://opendoodles.s3-us-west-1.amazonaws.com/falling.svg","work office papers"],
  ["strolling","Strolling character","https://opendoodles.s3-us-west-1.amazonaws.com/strolling.svg","walking fashion"],
  ["icecream","Ice cream lover","https://opendoodles.s3-us-west-1.amazonaws.com/icecream.svg","food summer"],
  ["dogjump","Dog and person","https://opendoodles.s3-us-west-1.amazonaws.com/dogjump.svg","dog pet jumping"],
  ["box","Surprise from a box","https://opendoodles.s3-us-west-1.amazonaws.com/box.svg","surprise delivery"],
  ["coffee","Coffee lover","https://opendoodles.s3-us-west-1.amazonaws.com/coffee.svg","coffee work cafe"],
  ["meditating","Meditating character","https://opendoodles.s3-us-west-1.amazonaws.com/meditating.svg","meditation calm wellness"],
  ["ballet","Ballet dancer","https://opendoodles.s3-us-west-1.amazonaws.com/ballet.svg","ballet dance"],
  ["running","Running for joy","https://opendoodles.s3-us-west-1.amazonaws.com/running.svg","running fitness"],
  ["levitate","Levitating character","https://opendoodles.s3-us-west-1.amazonaws.com/levitate.svg","levitate floating"],
  ["bookfloor","Reading on the floor","https://opendoodles.s3-us-west-1.amazonaws.com/bookfloor.svg","book reading"],
  ["cheerful","Cheerful character","https://opendoodles.s3-us-west-1.amazonaws.com/cheerful.svg","happy smiling"],
  ["rollerskating","Roller skating","https://opendoodles.s3-us-west-1.amazonaws.com/rollerskating.svg","roller skating sport"],
].map(([id,label,imageUrl,keywords])=>({id:"open-doodles-"+id,label,symbol:"",category:"Characters",imageUrl,source:"Open Doodles · Pablo Stanley · CC0",keywords}));

const CATEGORIES=["All assets","Characters","Symbols","Signs & arrows","Badges & labels","Business & tech","Places & travel","Lifestyle & hobbies"];

export default function AssetLibrary({onChoose,onClose,initialCategory="All assets"}:{onChoose:(asset:StudioAsset)=>void;onClose:()=>void;initialCategory?:string}) {
  const [category,setCategory]=useState(initialCategory);
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>[...CHARACTER_ART,...ASSETS].filter(asset=>(category==="All assets"||asset.category===category)&&(query.trim()===""||(asset.label+" "+asset.keywords+" "+asset.symbol).toLowerCase().includes(query.toLowerCase()))),[category,query]);
  return <div className="asset-library-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section className="asset-library" role="dialog" aria-modal="true" aria-label="Asset library">
      <header className="asset-library-header"><div><span className="asset-library-mark"><Sparkles size={16}/></span><div><strong>Asset library</strong><small>230+ stickers, symbols and illustrated characters</small></div></div><button className="asset-close" onClick={onClose} aria-label="Close asset library"><X size={18}/></button></header>
      <div className="asset-search"><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search stickers, icons, arrows..." autoFocus/><kbd>⌘ K</kbd></div>
      <nav className="asset-categories">{CATEGORIES.map(item=><button key={item} className={category===item?"active":""} onClick={()=>setCategory(item)}>{item}</button>)}</nav>
      <div className="asset-results-head"><strong>{category}</strong><span>{filtered.length} assets</span></div>
      <div className="asset-grid">{filtered.map(asset=><button key={asset.id} className="asset-tile" title={asset.label} onClick={()=>onChoose(asset)}><span className={asset.imageUrl?"asset-character-preview":""}>{asset.imageUrl?<img src={asset.imageUrl} alt={asset.label} loading="lazy"/>:asset.symbol}</span><small>{asset.label}</small></button>)}</div>
      {filtered.length===0&&<div className="asset-empty">No assets found. Try another search.</div>}
      <footer className="asset-library-footer">Select an asset to add it to the active slide. Resize, rotate and layer it on the canvas. Character illustrations: Open Doodles by Pablo Stanley, CC0.</footer>
    </section>
  </div>;
}

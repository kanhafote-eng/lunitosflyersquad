'use strict';
/* MondQuest · retro-futurist anime skin: SVG symbol set, emoji→SVG swap, new explainer, new Lunino. Visual layer only. */
(function(){
const Y='#FFD21F',P='#FF4FA3',C='#35E6FF',B='#3D6BFF',V='#9A6BFF',G='#4DE3A0',O='#FF8A3D',W='#FFF6E6',N='#1A1250',L='#BFD4FF';
const hl=(d,o='.7')=>`<path d="${d}" stroke="#fff" stroke-width="2" opacity="${o}" fill="none"/>`;
const SYM={
moon:`<circle cx="24" cy="24" r="23" fill="#1A1250" stroke="none"/><image href="assets/logo-mond.png" x="2" y="2" width="44" height="44"/>`,
flyer:`<path d="M11 5h20l8 8v30H11z" fill="${W}"/><path d="M31 5v8h8" fill="${L}"/><rect x="15" y="17" width="20" height="8" rx="2" fill="${P}"/><path d="M16 31h18M16 36h12" stroke-width="2"/><path d="M24 20.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z" fill="${Y}" stroke-width="1"/>`,
poster:`<rect x="8" y="6" width="32" height="37" rx="2" fill="${C}"/><rect x="12" y="10" width="24" height="29" fill="${W}" stroke-width="2"/><circle cx="27" cy="19" r="4.5" fill="${Y}"/><path d="M12 39l8-12 6 8 4-5 6 9z" fill="${B}"/><path d="M5 6h9v5H5zM34 6h9v5h-9z" fill="${Y}" stroke-width="2"/>`,
sticker:`<path d="M8 12a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v18L28 43H12a4 4 0 0 1-4-4z" fill="${G}"/><path d="M28 43V33a3 3 0 0 1 3-3h9" fill="${W}"/><path d="M22 14l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z" fill="${Y}" stroke-width="2"/>`,
pin:`<path d="M24 45C14 31 9 25 9 18a15 15 0 0 1 30 0c0 7-5 13-15 27z" fill="${P}"/><circle cx="24" cy="18" r="6" fill="${W}"/>${hl('M14 14a11 11 0 0 1 6-6')}`,
scope:`<path d="M6 21l27-11 5 11-27 11z" fill="${V}"/><path d="M33 10l5 11" stroke-width="5"/><ellipse cx="35.5" cy="15.5" rx="3" ry="6.5" transform="rotate(-24 35.5 15.5)" fill="${C}"/><path d="M20 30l-6 14M20 30l7 14M20 30v14" stroke-width="2.6"/><path d="M12 24l6-2.5" stroke="${Y}" stroke-width="3"/>`,
tent:`<path d="M5 41V25L24 9l19 16v16z" fill="${W}"/><path d="M24 9L14 41h-9V25zM24 9l10 32h9V25z" fill="${P}" /><path d="M24 9v32" stroke-width="2"/><path d="M19 41v-8a5 5 0 0 1 10 0v8z" fill="${N}"/><path d="M24 9V3l7 2.5-7 2" fill="${Y}" stroke-width="2"/>`,
bag:`<path d="M17 14a7 7 0 0 1 14 0" fill="none" stroke-width="3"/><path d="M10 19a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="${O}"/><path d="M10 25h28" /><rect x="20" y="22" width="8" height="7" rx="1.5" fill="${Y}" stroke-width="2"/>${hl('M14 20v3','.8')}`,
container:`<rect x="4" y="11" width="40" height="27" rx="2" fill="${B}"/><path d="M11 11v27M18 11v27M25 11v27M32 11v27M39 11v27" stroke-width="1.8" opacity=".75"/><path d="M4 16h40M4 33h40" stroke-width="2"/><rect x="2" y="9" width="7" height="6" fill="${Y}" stroke-width="2"/><rect x="39" y="9" width="7" height="6" fill="${Y}" stroke-width="2"/><rect x="2" y="34" width="7" height="6" fill="${Y}" stroke-width="2"/><rect x="39" y="34" width="7" height="6" fill="${Y}" stroke-width="2"/>`,
star:`<path d="M24 4l6 13 14 1.8-10.4 9.7 2.8 14L24 35.6 11.6 42.5l2.8-14L4 18.8 18 17z" fill="${Y}"/>${hl('M12 17l6-1','.9')}`,
chest:`<path d="M6 21a18 14 0 0 1 36 0z" fill="${V}"/><rect x="6" y="21" width="36" height="21" rx="2" fill="${B}"/><path d="M6 29h36M16 12v30M32 12v30" stroke-width="2.4"/><rect x="20" y="25" width="8" height="9" rx="2" fill="${Y}"/><circle cx="24" cy="29.5" r="1.6" fill="${N}"/><path d="M40 6l1.2 2.8L44 10l-2.8 1.2L40 14l-1.2-2.8L36 10l2.8-1.2z" fill="${Y}" stroke-width="1"/>`,
drink:`<path d="M8 10h32L26 28v11" fill="${C}" /><path d="M16 10h16l-8 10z" fill="${P}" stroke="none" opacity=".9"/><path d="M17 41h14M24 28v13" stroke-width="3"/><path d="M30 14l8-9" stroke="${Y}" stroke-width="3.5"/><circle cx="35" cy="9" r="3.4" fill="${P}" stroke-width="2"/>`,
popcorn:`<path d="M13 22h22l-3.5 21h-15z" fill="${W}"/><path d="M19 22l1.5 21M27 22l-1.5 21" stroke="none"/><path d="M16.5 22l2.5 21h-3.6zM29 22l-1.5 21h-3.4z" fill="${P}" stroke-width="1.6"/><circle cx="15" cy="17" r="5" fill="${Y}"/><circle cx="24" cy="13" r="6" fill="${W}"/><circle cx="33" cy="17" r="5" fill="${Y}"/><circle cx="21" cy="19" r="4" fill="${W}"/><circle cx="28" cy="20" r="3.4" fill="${Y}"/>`,
ticket:`<path d="M5 13h38v8a3.5 3.5 0 0 0 0 7v8H5v-8a3.5 3.5 0 0 0 0-7z" fill="${Y}"/><path d="M32 13v22" stroke-dasharray="2.5 3" stroke-width="2"/><path d="M18 18l2 4.3 4.7.6-3.4 3.3.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.4-3.3 4.7-.6z" fill="${P}" stroke-width="1.8"/>`,
tshirt:`<path d="M17 6l-12 6 4 9 6-2.5V42h18V18.5l6 2.5 4-9-12-6c0 4-3 6-7 6s-7-2-7-6z" fill="${C}"/><path d="M17 6c0 4 3 6 7 6s7-2 7-6" fill="${N}" stroke-width="2"/><path d="M16 30h16" stroke="${Y}" stroke-width="4"/>`,
socks:`<path d="M14 5h13v19l11 9a6 6 0 0 1-3 10l-7 2c-5 1-8-2-10-5L14 28z" fill="${P}"/><path d="M14 10h13M14 16h13" stroke="${W}" stroke-width="3"/><path d="M14 5h13v4H14z" fill="${Y}" stroke-width="2"/>`,
cap:`<path d="M7 31a17 17 0 0 1 34 0z" fill="${B}"/><path d="M5 31h25c10 0 13 4 13 7H12c-4 0-7-3-7-7z" fill="${Y}"/><circle cx="24" cy="14" r="2.4" fill="${Y}" stroke-width="2"/><path d="M24 14v17" stroke-width="2"/>`,
gift:`<rect x="6" y="19" width="36" height="9" rx="2" fill="${P}"/><rect x="9" y="28" width="30" height="15" rx="2" fill="${C}"/><path d="M24 19v24" stroke="${Y}" stroke-width="6"/><path d="M24 19c-4-9-12-8-11-3s8 4 11 3zM24 19c4-9 12-8 11-3s-8 4-11 3z" fill="${Y}"/>`,
camera:`<path d="M6 16a3 3 0 0 1 3-3h6l3-4h12l3 4h6a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="${W}"/><circle cx="24" cy="26" r="9" fill="${N}"/><circle cx="24" cy="26" r="5.5" fill="${C}"/><circle cx="21.5" cy="23.5" r="1.8" fill="#fff" stroke="none"/><circle cx="37" cy="18" r="1.8" fill="${P}" stroke-width="1.4"/>`,
chat:`<path d="M8 8h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H25l-9 8v-8H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="${B}"/><circle cx="16" cy="21" r="2.7" fill="${W}"/><circle cx="24" cy="21" r="2.7" fill="${W}"/><circle cx="32" cy="21" r="2.7" fill="${W}"/>`,
shirt:`<path d="M17 5 4 11l5 10 6-3v24h18V18l6 3 5-10-13-6c-1 4-4 6-7 6s-6-2-7-6z" fill="${P}"/><path d="M20 5c1 3 3 5 4 5s3-2 4-5" fill="${W}"/>`,
gear:`<path d="M21 4h6l1 5a15 15 0 0 1 4 2l5-2 3 5-4 3a15 15 0 0 1 0 5l4 3-3 5-5-2a15 15 0 0 1-4 2l-1 5h-6l-1-5a15 15 0 0 1-4-2l-5 2-3-5 4-3a15 15 0 0 1 0-5l-4-3 3-5 5 2a15 15 0 0 1 4-2z" fill="${Y}"/><circle cx="24" cy="24" r="6" fill="${C}"/>`,
bell:`<path d="M24 5a3 3 0 0 1 3 3v1.6c5 1.6 8 6 8 11.4v7l4 5H9l4-5v-7c0-5.400 3-9.800 8-11.400V8a3 3 0 0 1 3-3z" fill="${Y}"/><path d="M19 38a5 5 0 0 0 10 0" fill="${O}"/>${hl('M16 20a8 8 0 0 1 4-6')}`,
globe:`<circle cx="24" cy="24" r="19" fill="${C}"/><path d="M8 20c6-2 8 2 12 0s4-8 10-8M14 36c2-4 6-2 8-6s8-2 12-6M33 40c0-5 5-6 8-8" fill="none" stroke="${G}" stroke-width="5"/><ellipse cx="24" cy="24" rx="9" ry="19" fill="none" stroke-width="1.8"/>`,
check:`<circle cx="24" cy="24" r="19" fill="${G}"/><path d="M14 25l7 7 13-15" fill="none" stroke-width="5"/>`,
cross:`<circle cx="24" cy="24" r="19" fill="${P}"/><path d="M16 16l16 16M32 16L16 32" stroke-width="5"/>`,
flag:`<path d="M12 43V6" stroke-width="3.4"/><path d="M12 8c6-3 10 3 17 0s8-2 8-2v17s-1-1-8 2-11-3-17 0z" fill="${P}"/>`,
lock:`<path d="M15 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke-width="4"/><rect x="9" y="21" width="30" height="21" rx="4" fill="${Y}"/><circle cx="24" cy="30" r="3.6" fill="${N}"/><path d="M24 31v6" stroke-width="3"/>`,
trophy:`<path d="M13 6h22v12a11 11 0 0 1-22 0z" fill="${Y}"/><path d="M13 10H6c0 8 3 11 8 12M35 10h7c0 8-3 11-8 12" fill="none" stroke-width="3"/><path d="M24 29v7M15 43v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4z" fill="${O}"/>${hl('M17 10v8')}`,
book:`<path d="M24 11c-5-4-12-4-18-3v29c6-1 13-1 18 3 5-4 12-4 18-3V8c-6-1-13-1-18 3z" fill="${C}"/><path d="M24 11v29" stroke-width="2.4"/><path d="M10 16c4-.5 8 0 11 1.500M10 22c4-.5 8 0 11 1.500M27 17.500c3-1.500 7-2 11-1.500M27 23.500c3-1.500 7-2 11-1.500" stroke-width="1.8" opacity=".8"/>`,
mail:`<rect x="5" y="11" width="38" height="27" rx="3" fill="${W}"/><path d="M6 13l18 14 18-14" fill="none" stroke-width="2.600"/><circle cx="38" cy="12" r="4.500" fill="${P}" stroke-width="2"/>`,
user:`<circle cx="24" cy="16" r="9" fill="${V}"/><path d="M6 43c0-10 8-16 18-16s18 6 18 16z" fill="${C}"/>${hl('M18 12a7 7 0 0 1 5-3')}`,
rocket:`<path d="M24 3c8 5 11 14 10 26H14C13 17 16 8 24 3z" fill="${W}"/><circle cx="24" cy="18" r="5" fill="${C}"/><path d="M14 22l-8 10 8 2zM34 22l8 10-8 2z" fill="${P}"/><path d="M18 33h12l-3 12h-6z" fill="${Y}"/><path d="M21 33l3 7 3-7" fill="${O}" stroke-width="1.6"/>`,
comet:`<path d="M37 11C26 12 12 22 5 40c10-7 20-8 28-14" fill="${C}" opacity=".95"/><path d="M33 17c-9 2-17 8-22 17M28 12c-8 2-13 6-18 12" fill="none" stroke-width="1.6"/><circle cx="35" cy="17" r="9" fill="${Y}"/><circle cx="32.500" cy="14.500" r="2.400" fill="#fff" stroke="none"/>`,
planet:`<circle cx="24" cy="24" r="12" fill="${O}"/><path d="M14 22c5 3 15 3 20 0" fill="none" stroke-width="1.8"/><ellipse cx="24" cy="26" rx="21" ry="6.500" transform="rotate(-18 24 26)" fill="none" stroke="${N}" stroke-width="6"/><ellipse cx="24" cy="26" rx="21" ry="6.500" transform="rotate(-18 24 26)" fill="none" stroke="${Y}" stroke-width="2.600"/>`,
sparkle:`<path d="M20 4c1.500 9 4 12 14 14-10 2-12.500 5-14 14-1.500-9-4-12-14-14 10-2 12.500-5 14-14z" fill="${Y}"/><path d="M36 28c.8 5 2 6.500 7 7.500-5 1-6.200 2.500-7 7.500-.8-5-2-6.500-7-7.500 5-1 6.200-2.500 7-7.500z" fill="${C}" stroke-width="2"/>`,
heart:`<path d="M24 42C8 31 5 22 5 16a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 6-3 15-19 26z" fill="${P}"/>${hl('M11 15a6 6 0 0 1 5-5')}`,
heartg:`<path d="M24 42C8 31 5 22 5 16a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 6-3 15-19 26z" fill="${G}"/>${hl('M11 15a6 6 0 0 1 5-5')}`,
hearto:`<path d="M24 42C8 31 5 22 5 16a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 6-3 15-19 26z" fill="${O}"/>${hl('M11 15a6 6 0 0 1 5-5')}`,
party:`<path d="M6 42L16 14l18 18z" fill="${Y}"/><path d="M11 30l12 10M14 22l15 14" stroke-width="2" opacity=".8"/><circle cx="32" cy="10" r="2.500" fill="${P}" stroke-width="1.600"/><path d="M37 20l4-3M26 6l1-4M40 30l4 1" stroke-width="2.800" stroke="${C}"/><rect x="31" y="22" width="5" height="3" fill="${G}" transform="rotate(30 33 23)" stroke-width="1.400"/>`,
mask:`<path d="M6 14c6-4 12-4 18 0 6-4 12-4 18 0v10c0 9-8 17-18 17S6 33 6 24z" fill="${Y}"/><path d="M12 22c3-2 6-2 8 1-3 2-6 2-8-1zM36 22c-3-2-6-2-8 1 3 2 6 2 8-1z" fill="${N}"/><path d="M17 32q7 5 14 0" fill="none" stroke-width="2.600"/>`,
guitar:`<path d="M30 6l4 4-8 8" fill="none" stroke-width="3.400"/><path d="M34 3l8 8-4 3-7-7z" fill="${V}" stroke-width="2.400"/><path d="M24 16c4 0 5 4 3 7 4 1 4 6 0 9-5 6-14 11-19 6s0-14 6-19c3-4 5-3 6-6 1-2 3-3 4-2z" fill="${O}"/><circle cx="18" cy="31" r="3.200" fill="${N}"/>`,
music:`<path d="M18 36V10l22-5v26" fill="none" stroke-width="3.200"/><path d="M18 18l22-5" stroke-width="5"/><ellipse cx="13" cy="37" rx="6.500" ry="5" fill="${C}" /><ellipse cx="35" cy="32" rx="6.500" ry="5" fill="${P}"/>`,
building:`<path d="M5 18L24 6l19 12z" fill="${Y}"/><path d="M9 19v18M18 19v18M30 19v18M39 19v18" stroke="${C}" stroke-width="5"/><path d="M9 19v18M18 19v18M30 19v18M39 19v18" stroke-width="1.600"/><rect x="4" y="37" width="40" height="6" rx="1.500" fill="${W}"/>`,
teddy:`<circle cx="11" cy="12" r="6" fill="${O}"/><circle cx="37" cy="12" r="6" fill="${O}"/><circle cx="24" cy="24" r="16" fill="${O}"/><ellipse cx="24" cy="30" rx="8" ry="6" fill="${W}"/><circle cx="18" cy="21" r="2.200" fill="${N}"/><circle cx="30" cy="21" r="2.200" fill="${N}"/><ellipse cx="24" cy="28" rx="2.800" ry="2" fill="${N}"/>`,
cart:`<path d="M3 6h7l5 24h22l4-17H12" fill="${C}" stroke-linejoin="round"/><path d="M15 30l-2 5h25" fill="none" stroke-width="2.800"/><circle cx="18" cy="40" r="3.500" fill="${Y}"/><circle cx="34" cy="40" r="3.500" fill="${Y}"/>`,
shopbag:`<path d="M16 16v-3a8 8 0 0 1 16 0v3" fill="none" stroke-width="3"/><path d="M8 16h32l2 26H6z" fill="${P}"/><circle cx="18" cy="23" r="1.800" fill="${N}"/><circle cx="30" cy="23" r="1.800" fill="${N}"/>`,
plate:`<circle cx="24" cy="25" r="15" fill="${W}"/><circle cx="24" cy="25" r="9" fill="none" stroke-width="2"/><path d="M5 6v14c0 3 3 3 3 3V43M11 6v14M5 12h6" fill="none" stroke-width="2.600"/><path d="M43 6c-4 3-5 9-5 14h5V43" fill="${C}" stroke-width="2.600"/>`,
cup:`<path d="M8 17h26v14a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 31z" fill="${W}"/><path d="M34 21h4a5 5 0 0 1 0 10h-4" fill="none" stroke-width="3"/><path d="M8 24h26" stroke="${P}" stroke-width="4"/><path d="M15 6c-3 3 3 4 0 8M23 6c-3 3 3 4 0 8" fill="none" stroke="${C}" stroke-width="2.600"/>`,
beer:`<path d="M9 14h24v26a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3z" fill="${Y}"/><path d="M33 20h5a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-5" fill="none" stroke-width="3"/><path d="M8 14a5 5 0 0 1 4-8 5 5 0 0 1 8-2 5 5 0 0 1 8 2 5 5 0 0 1 6 8z" fill="${W}"/><path d="M16 22v14M24 22v14" stroke-width="2" opacity=".6"/>`,
hat:`<path d="M14 8h20l2 22H12z" fill="${P}"/><path d="M12.500 25h23" stroke="${Y}" stroke-width="5"/><ellipse cx="24" cy="31" rx="19" ry="5.500" fill="${N}"/><ellipse cx="24" cy="8" rx="10" ry="2.400" fill="${P}" stroke-width="2"/>`,
crown:`<path d="M6 36L8 13l10 10 6-13 6 13 10-10 2 23z" fill="${Y}"/><rect x="6" y="36" width="36" height="6" rx="1.500" fill="${O}"/><circle cx="24" cy="30" r="2.800" fill="${P}" stroke-width="2"/><circle cx="14" cy="31" r="2" fill="${C}" stroke-width="1.600"/><circle cx="34" cy="31" r="2" fill="${C}" stroke-width="1.600"/>`,
shades:`<path d="M3 17h42M5 17l3 13a6 6 0 0 0 6 4h4a6 6 0 0 0 6-5l2-5h-0" fill="none" stroke-width="0"/><path d="M5 16h38l-2 12a6 6 0 0 1-6 5h-4a6 6 0 0 1-6-5l-1-4h-4l-1 4a6 6 0 0 1-6 5h-4a6 6 0 0 1-6-5z" fill="${N}"/><path d="M10 21l4-3M12 27l8-7M30 21l4-3M32 27l8-7" stroke="${C}" stroke-width="2.400"/>`,
bow:`<path d="M24 24L6 13v22zM24 24l18-11v22z" fill="${P}"/><path d="M12 24l-3-6M36 24l3-6" stroke-width="1.800" opacity=".7"/><circle cx="24" cy="24" r="5" fill="${Y}"/>`,
wings:`<path d="M24 36C10 36 4 24 4 8c8 2 12 5 14 9 1-4 3-6 6-8 3 2 5 4 6 8 2-4 6-7 14-9 0 16-6 28-20 28z" fill="${L}"/><path d="M24 36V17M14 33c-3-6-4-12-3-17M34 33c3-6 4-12 3-17" fill="none" stroke-width="2"/>`,
helmet:`<path d="M6 30a18 18 0 0 1 36 0v6H6z" fill="${C}" opacity=".85"/><path d="M4 36h40v6H4z" fill="${L}" stroke-width="2.600"/><path d="M13 22a12 12 0 0 1 8-8M12 28h4" stroke="#fff" stroke-width="3" opacity=".9"/>`,
bubble:`<circle cx="22" cy="26" r="14" fill="${C}" opacity=".6"/><circle cx="37" cy="12" r="6" fill="${C}" opacity=".6"/><path d="M14 22a9 9 0 0 1 6-6" stroke="#fff" stroke-width="3" opacity=".9" fill="none"/>`,
toolbox:`<path d="M17 14v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" fill="none" stroke-width="3"/><rect x="5" y="14" width="38" height="27" rx="3" fill="${O}"/><path d="M5 25h38" stroke-width="2.400"/><rect x="20" y="22" width="8" height="7" rx="1.500" fill="${Y}" stroke-width="2"/>`,
package:`<path d="M5 14L24 6l19 8v22L24 44 5 36z" fill="${O}"/><path d="M5 14l19 8 19-8M24 22v22" fill="none" stroke-width="2.400"/><path d="M14.500 10L33 18v6" stroke="${Y}" stroke-width="4" fill="none"/>`,
truck:`<path d="M3 13h26v22H3z" fill="${W}"/><path d="M29 20h9l6 7v8H29z" fill="${C}"/><circle cx="14" cy="37" r="5" fill="${Y}"/><circle cx="36" cy="37" r="5" fill="${Y}"/><path d="M9 20h14" stroke="${P}" stroke-width="4"/>`,
frame:`<rect x="5" y="7" width="38" height="34" rx="3" fill="${Y}"/><rect x="10" y="12" width="28" height="24" fill="${C}" stroke-width="2.200"/><circle cx="29" cy="20" r="3.500" fill="${W}"/><path d="M10 36l9-11 7 8 4-4 8 7z" fill="${G}"/>`,
magnifier:`<circle cx="20" cy="20" r="13" fill="${C}" opacity=".85"/><path d="M30 30l13 13" stroke-width="6"/><path d="M30 30l13 13" stroke="${Y}" stroke-width="2.200"/><path d="M12 18a8 8 0 0 1 6-6" stroke="#fff" stroke-width="2.600" fill="none"/>`,
megaphone:`<path d="M6 19h9l20-11v32L15 29H6z" fill="${P}"/><path d="M15 19v10M11 29l3 12h6l-3-12" fill="${Y}" stroke-width="2.200"/><path d="M40 16c3 3 3 13 0 16" fill="none" stroke="${C}" stroke-width="3"/>`,
dish:`<path d="M6 24c0 10 8 18 18 18 4-4 4-14-6-24S10 20 6 24z" fill="${L}" transform="rotate(-20 24 28)"/><path d="M30 22l10-10" stroke-width="3"/><circle cx="41" cy="11" r="3.500" fill="${P}" stroke-width="2"/><path d="M24 42v-6" stroke-width="3"/>`,
bolt:`<path d="M27 3L9 27h12l-4 18 22-26H26z" fill="${Y}"/>${hl('M25 9l-9 13','.9')}`,
rank:`<path d="M24 4l17 6v12c0 11-7 18-17 22C14 40 7 33 7 22V10z" fill="${B}"/><path d="M24 12l3.500 7 7.500 1-5.500 5.200 1.400 7.600-6.900-3.800-6.900 3.800 1.400-7.600L13 20l7.500-1z" fill="${Y}" stroke-width="2"/>`,
dot:`<circle cx="24" cy="24" r="8" fill="${Y}"/>`
};
const ALIAS={'💬':'chat','👕':'shirt','⚙️':'gear','⚙':'gear','🌙':'moon','◉':'moon','☾':'moon','✨':'sparkle','✦':'sparkle','✧':'sparkle','📍':'pin','📌':'pin','🔭':'scope','⭐':'star','★':'star','🪐':'planet','☕':'cup','🪧':'poster','📣':'megaphone','📡':'dish','☄️':'comet','☄':'comet','🎪':'tent','🍽️':'plate','🍽':'plate','🍺':'beer','🛒':'cart','🛍️':'shopbag','🛍':'shopbag','🧸':'teddy','🏛️':'building','🏛':'building','🎸':'guitar','🎼':'music','🎭':'mask','✉':'mail','✉️':'mail','👤':'user','🎩':'hat','👑':'crown','🕶️':'shades','🕶':'shades','🎀':'bow','🪽':'wings','🪖':'helmet','🫧':'bubble','🚀':'rocket','🧰':'toolbox','📬':'mail','🔎':'magnifier','✕':'cross','⚑':'flag','📦':'package','🚚':'truck','🖼️':'frame','🖼':'frame','🏆':'trophy','📖':'book','💚':'heartg','🎟️':'ticket','🎟':'ticket','🎉':'party','🧡':'hearto','🔒':'lock','✓':'check','🛎️':'bell','🛎':'bell'};
window.MQ_ICON_NAMES=Object.keys(SYM);
const attrs='viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
function sprite(){if(document.getElementById('mq-sprite'))return;const d=document.createElement('div');d.id='mq-sprite';d.setAttribute('aria-hidden','true');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
 d.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">${Object.entries(SYM).map(([k,v])=>`<symbol id="i-${k}" ${attrs}>${v}</symbol>`).join('')}</svg>`;document.body.prepend(d)}
window.mqIcon=function(name,cls){return `<svg class="mq-i ${cls||''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const keys=Object.keys(ALIAS).sort((a,b)=>b.length-a.length);
const RE=new RegExp('('+keys.map(esc).join('|')+')️?','g');
const SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION','SVG','TITLE','SELECT']);
function swap(root){
  if(!root)return;
  if(root.nodeType===3){swapText(root);return}
  if(root.nodeType!==1||SKIP.has(root.tagName.toUpperCase())||(root.closest&&root.closest('.leaflet-control-attribution,[data-no-icons]')))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return(!p||SKIP.has(p.tagName.toUpperCase())||p.closest('svg,textarea,select,option,[data-no-icons]'))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  const list=[];let n;while(n=w.nextNode())if(/[^\x00-\x7F]/.test(n.nodeValue))list.push(n);list.forEach(swapText)}
function swapText(n){const t=n.nodeValue;RE.lastIndex=0;if(!RE.test(t))return;RE.lastIndex=0;
  const f=document.createDocumentFragment();let last=0,m;
  while((m=RE.exec(t))){if(m.index>last)f.appendChild(document.createTextNode(t.slice(last,m.index)));const name=ALIAS[m[1]];
    const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','mq-i');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');
    const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+name);s.appendChild(u);f.appendChild(s);last=m.index+m[0].length}
  if(last<t.length)f.appendChild(document.createTextNode(t.slice(last)));if(n.parentNode)n.parentNode.replaceChild(f,n)}
let pending=false;const q=new Set();
const MENU_ICON={missions:'star',places:'pin',pickup:'tent',shop:'container',settings:'gear',chat:'chat',wardrobe:'shirt',players:'user',adventures:'rocket',ranking:'trophy',spotted:'scope',courier:'user',announcements:'bell',manual:'book',more:'sparkle'};
function menuIcons(){document.querySelectorAll('.lunar-sheet .button[data-view],.menu-grid .button[data-view],.more-grid .button[data-view]').forEach(b=>{if(b.dataset.mqi)return;const ic=MENU_ICON[b.dataset.view];const s=b.querySelector(':scope>svg:not(.mq-i)');if(ic&&s){s.outerHTML=mqIcon(ic,'menu-ic');}b.dataset.mqi='1'})}
function chestIcon(){document.querySelectorAll('.mq-chest:not([data-mqi])').forEach(c=>{c.dataset.mqi='1';c.insertAdjacentHTML('afterbegin',mqIcon('chest','chest-ic'))})}
function flush(){pending=false;const items=[...q];q.clear();items.forEach(swap);menuIcons();chestIcon()}
function start(){sprite();swap(document.body);
  new MutationObserver(ms=>{ms.forEach(m=>{if(m.type==='characterData')q.add(m.target);else m.addedNodes.forEach(a=>q.add(a))});if(!pending){pending=true;queueMicrotask(flush)}}).observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);

/* ---------- Explainer: short, covers the whole game ---------- */
function rewardIcon(r){const c=String(r.category||'').toLowerCase();return c.includes('drink')?'drink':c.includes('snack')?'popcorn':c.includes('ticket')?'ticket':/sock/i.test(r.name)?'socks':/cap|beanie/i.test(r.name)?'cap':'tshirt'}
const chip=(ic,txt)=>`<span class="gchip">${mqIcon(ic)}<b>${txt}</b></span>`;
function fmt(n){return Number.isInteger(n)?String(n):String(+n.toFixed(2))}
function guideSteps(){
  const P=CONFIG.points,fl=Math.max(1,Math.round(1/(P.deliverPerItem||.2)));
  const rw=mqVisibleRewards().slice().sort((a,b)=>a.cost-b.cost).slice(0,4);
  return[
   {ic:'tent',t:'Grab your gear',b:'Collect flyers, posters and stickers at the circus tent. Staff can top you up.',chips:[chip('flyer','Flyers'),chip('poster','Posters'),chip('sticker','Stickers'),chip('moon','+'+P.pickup)]},
   {ic:'pin',t:'Drop them in town',b:'Leave them in cafés, shops and bars on the map. Found a new spot? Add it.',chips:[chip('flyer',fl+' = 1'),chip('poster','+'+fmt(P.posterPerItem)),chip('pin','New +'+P.discover),chip('scope','Far sticker +5 to +'+CONFIG.spotted.max)]},
   {ic:'moon',t:'Earn Mondinos',b:'Every drop pays in Mondinos. '+(mqAgeU16()?'Combos and regular days add bonuses.':'Photos, combos and regular days add bonuses.')+' Unused material expires after '+CONFIG.pickup.expiryDays+' days.',chips:[...(mqAgeU16()?[]:[chip('camera','Photo +'+P.deliveryPhoto)]),chip('star','Combos'),chip('bolt',CONFIG.regularity.days+' days / week'),chip('bell',CONFIG.pickup.expiryDays+' days')]},
   {ic:'rocket',t:'Rank up',b:'Lifetime Mondinos raise your rank. Adventures multiply your points and drop minerals and chests.',chips:[chip('rank','Ranks'),chip('comet','x2 · x3'),chip('planet','Minerals'),chip('chest','Chests')]},
   {ic:'container',t:'Open Cargo',b:'Craft gadgets, dress your Lunino, or claim real prizes at the circus with your player code.',chips:rw.map(r=>chip(rewardIcon(r),r.cost)).concat([chip('user','Your code')])}
  ]}
window.mqGuideSteps=window.mqGuideSteps||[];
mqRenderGuide=function(){const S=guideSteps(),i=Math.min(mqGuideIndex,S.length-1),x=S[i],last=i===S.length-1;
 app.innerHTML=`<main class="onboarding">${typeof mqOnboardingMap==='function'?mqOnboardingMap():''}<section class="onboard-panel guide-panel" aria-labelledby="onboard-title"><div class="onboard-kicker">QUICK FLIGHT MANUAL · ${String(i+1).padStart(2,'0')} / ${String(S.length).padStart(2,'0')}</div><div class="guide-progress" aria-label="Step ${i+1} of ${S.length}">${S.map((_,k)=>`<i class="${k<=i?'filled':''}"></i>`).join('')}</div><div class="guide-icon guide-hero" aria-hidden="true">${mqIcon(x.ic)}</div><h1 id="onboard-title">${x.t}</h1><p class="guide-body">${x.b}</p><div class="gchips">${x.chips.join('')}</div><div class="guide-actions"><button class="button quiet" data-action="guide-back" ${i===0?'disabled':''}>Back</button><button class="button primary onboard-next" data-action="finish-guide">${last?'Enter the atlas':'Next'} <span aria-hidden="true">→</span></button></div><button class="guide-skip" data-action="skip-guide">Skip guide</button></section></main>`};

/* ---------- New Lunino: anime retro-futurist space courier ---------- */
const OL='#1A1250';
function hex(h){h=String(h).replace('#','');return[0,2,4].map(i=>parseInt(h.substr(i,2),16))}
function mix(h,t,a){const A=hex(h),B=hex(t);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*a).toString(16).padStart(2,'0')).join('')}
const okc=(v,f)=>/^#[0-9a-fA-F]{6}$/.test(String(v||''))?v:f;
courierSvg=function(u={}){
  const d=(CONFIG.look&&CONFIG.look.defaults)||{},skin=okc(u.skin,d.skin||'#f5cba7'),hair=okc(u.hair,d.hair||'#5a3a22'),suit=okc(u.suit||u.avatar,d.suit||'#6b3fa0');
  const eq=(state&&state.accessories&&state.accessories.equipped)||[],has=i=>eq.includes(i);
  const hs=['tuft','none','curl','mohawk'].includes(u.hairStyle)?u.hairStyle:'tuft',hg=['none','helmet','antennae','starclip'].includes(u.headgear)?u.headgear:'none',ss=['plain','stripes','stars','belt'].includes(u.suitStyle)?u.suitStyle:'plain';
  const style=has('mohawk')?'mohawk':hs,head=hg!=='none'?hg:(has('helmet')?'helmet':'none'),stars=ss==='stars'||has('stardust');
  const skinD=mix(skin,'#3a1a6b',.22),skinL=mix(skin,'#ffffff',.35),suitD=mix(suit,'#0a0630',.32),suitL=mix(suit,'#ffffff',.3),hairD=mix(hair,'#0a0630',.35),hairL=mix(hair,'#ffffff',.4);
  const iris=mix(hair,'#35E6FF',hs==='none'?.0:.35),irisD=mix(iris,'#0a0630',.45);
  const st=`stroke="${OL}" stroke-linejoin="round" stroke-linecap="round"`;
  const orb=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r+5}" fill="${c}" opacity=".28"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${st} stroke-width="3"/><circle cx="${x-r*.3}" cy="${y-r*.35}" r="${r*.32}" fill="#fff"/>`;
  const wings=has('wings')?`<path d="M46 124L6 98l6 38 18 6-8 16 28-10z" fill="#BFD4FF" ${st} stroke-width="3.4"/><path d="M114 124l40-26-6 38-18 6 8 16-28-10z" fill="#BFD4FF" ${st} stroke-width="3.4"/><path d="M14 112l22 8M16 126l18 6M146 112l-22 8M144 126l-18 6" stroke="${OL}" stroke-width="2" opacity=".6"/>`:'';
  const arms=`<path d="M48 130Q34 142 38 158M112 130Q126 142 122 158" fill="none" stroke="${OL}" stroke-width="15" stroke-linecap="round"/><path d="M48 130Q34 142 38 158M112 130Q126 142 122 158" fill="none" stroke="${suit}" stroke-width="9" stroke-linecap="round"/><circle cx="38" cy="160" r="7.500" fill="#fff6e6" ${st} stroke-width="3"/><circle cx="122" cy="160" r="7.500" fill="#fff6e6" ${st} stroke-width="3"/>`;
  const body=`<path d="M40 176Q35 134 56 124H104Q125 134 120 176Z" fill="${suit}" ${st} stroke-width="4"/><path d="M82 126H104Q123 135 118 174H82Z" fill="${suitD}" opacity=".55"/><path d="M52 133Q48 150 50 168" stroke="${suitL}" stroke-width="3.500" fill="none" stroke-linecap="round" opacity=".8"/><path d="M52 126h56" stroke="${Y}" stroke-width="3" stroke-linecap="round" opacity="0"/>`
   +(ss==='stripes'?`<path d="M46 150l22-22M44 168l38-38M62 172l44-44M84 174l32-32" stroke="#fff6e6" stroke-width="6" opacity=".9" stroke-linecap="butt"/>`:'')
   +(stars?`<path d="M58 150l2 4.500 5 .7-3.600 3.400.9 5-4.300-2.300-4.300 2.300.9-5-3.600-3.400 5-.7zM110 160l1.600 3.400 3.700.5-2.700 2.600.7 3.700-3.300-1.800-3.300 1.800.7-3.700-2.700-2.600 3.700-.5z" fill="${Y}" stroke="${OL}" stroke-width="1.600"/>`:'')
   +(ss==='belt'?`<path d="M41 160Q80 172 119 160V170Q80 182 41 170Z" fill="#34455e" ${st} stroke-width="3"/><rect x="72" y="163" width="16" height="12" rx="2.500" fill="${Y}" ${st} stroke-width="2.500"/>`:'')
   +`<circle cx="80" cy="146" r="10" fill="${OL}"/><circle cx="80" cy="146" r="7.500" fill="${Y}"/><circle cx="83" cy="143.500" r="6.200" fill="${OL}"/><circle cx="84.500" cy="142" r="5.200" fill="${suit}" opacity="0"/>`
   +`<ellipse cx="80" cy="124" rx="24" ry="7.500" fill="#DDE8FF" ${st} stroke-width="3.500"/><path d="M60 124Q80 131 100 124" fill="none" stroke="${OL}" stroke-width="2" opacity=".5"/>`
   +(has('ringed')?`<ellipse cx="80" cy="152" rx="56" ry="10" transform="rotate(-12 80 152)" fill="none" stroke="${OL}" stroke-width="8"/><ellipse cx="80" cy="152" rx="56" ry="10" transform="rotate(-12 80 152)" fill="none" stroke="${Y}" stroke-width="4"/>`:'');
  const fins=`<path d="M38 82Q20 80 14 62Q32 60 41 72Z" fill="${skinD}" ${st} stroke-width="3"/><path d="M122 82Q140 80 146 62Q128 60 119 72Z" fill="${skinD}" ${st} stroke-width="3"/>`;
  const thinAnt=(head==='antennae')?`<path d="M62 44Q54 22 38 14M98 44Q106 22 122 14" fill="none" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M62 44Q54 22 38 14M98 44Q106 22 122 14" fill="none" stroke="#DDE8FF" stroke-width="2"/>${orb(36,13,8.500,P)}${orb(124,13,8.500,C)}`
   :(has('antenna')?`<path d="M58 46Q44 30 32 26M102 46Q116 30 128 26" fill="none" stroke="${OL}" stroke-width="4.500" stroke-linecap="round"/><path d="M18 24a14 9 0 0 0 26 4z M116 28a14 9 0 0 0 26-4z" fill="${Y}" ${st} stroke-width="3"/><circle cx="31" cy="24" r="2.500" fill="${P}"/><circle cx="129" cy="24" r="2.500" fill="${P}"/>`
   :`<path d="M64 42Q60 28 52 22M96 42Q100 28 108 22" fill="none" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M64 42Q60 28 52 22M96 42Q100 28 108 22" fill="none" stroke="#DDE8FF" stroke-width="1.800"/>${orb(50,20,7,hair)}${orb(110,20,7,hair)}`);
  const headShape=`<ellipse cx="80" cy="80" rx="46" ry="42" fill="${skin}" ${st} stroke-width="4"/><path d="M122 70Q126 98 98 114Q88 119 74 119Q110 112 118 88Z" fill="${skinD}" opacity=".55"/><ellipse cx="54" cy="52" rx="10" ry="4.500" transform="rotate(-28 54 52)" fill="#fff" opacity=".55"/>`;
  let hairShape='';
  const bang=`<path d="M36 74Q32 40 62 32Q80 26 98 32Q128 40 124 74Q116 58 102 58Q94 66 86 56Q76 66 68 56Q50 60 36 74Z" fill="${hair}" ${st} stroke-width="3.500"/><path d="M50 46Q64 36 84 36" fill="none" stroke="${hairL}" stroke-width="4" stroke-linecap="round" opacity=".75"/><path d="M104 40Q112 44 116 54" fill="none" stroke="${hairD}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;
  if(style==='tuft')hairShape=bang+`<path d="M78 34Q74 18 88 12Q86 22 92 26Z" fill="${hair}" ${st} stroke-width="3"/>`;
  if(style==='curl')hairShape=bang+`<path d="M38 66q-18 2-16-12 3-11 14-6M122 66q18 2 16-12-3-11-14-6" fill="none" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M38 66q-18 2-16-12 3-11 14-6M122 66q18 2 16-12-3-11-14-6" fill="none" stroke="${hair}" stroke-width="6.500" stroke-linecap="round"/>`;
  if(style==='mohawk')hairShape=`<path d="M58 54Q54 40 60 32L58 10L72 28L82 2L92 28L106 10L100 32Q106 42 102 54Q80 46 58 54Z" fill="${hair}" ${st} stroke-width="3.500"/><path d="M70 26l8-14M88 28l8-8" stroke="${hairL}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
  const lash=(x,s)=>`<path d="M${x-12*s} 76Q${x} 64 ${x+12*s} 74" fill="none" stroke="${OL}" stroke-width="4.500" stroke-linecap="round"/><path d="M${x+12*s} 74l${6*s} -4" stroke="${OL}" stroke-width="3.500" stroke-linecap="round"/>`;
  const eye=(x,s)=>`<ellipse cx="${x}" cy="86" rx="12" ry="15" fill="#fff" ${st} stroke-width="3"/><ellipse cx="${x}" cy="88" rx="9" ry="12" fill="${iris}"/><path d="M${x-9} 88a9 12 0 0 1 18 0q-9-6-18 0z" fill="${irisD}"/><path d="M${x-8} 94q8 8 16 0" fill="none" stroke="#fff" stroke-width="1.800" opacity=".6"/><ellipse cx="${x}" cy="89" rx="4.500" ry="7.500" fill="${OL}"/><circle cx="${x-3.200*s}" cy="82" r="3.800" fill="#fff"/><circle cx="${x+3.500*s}" cy="95" r="1.800" fill="#fff"/>${lash(x,s)}`;
  const face=eye(62,1)+eye(98,-1).replace(/M98/g,'M98')
   +`<path d="M50 70Q58 65 70 69M110 70Q102 65 90 69" fill="none" stroke="${hairD}" stroke-width="3" stroke-linecap="round" opacity="0"/>`
   +`<path d="M72 106Q80 113 88 106" fill="none" stroke="${OL}" stroke-width="3.200" stroke-linecap="round"/><path d="M77 108.500q3 3 6 0" fill="#FF4FA3" stroke="none" opacity=".8"/>`
   +`<path d="M46 100l5-5M50 104l5-5M54 108l5-5M114 100l-5-5M110 104l-5-5M106 108l-5-5" stroke="#FF4FA3" stroke-width="2.200" stroke-linecap="round" opacity=".85"/>`;
  const visor=has('shades')?`<path d="M40 78H120V92Q120 104 108 104H92Q85 104 83 96H77Q75 104 68 104H52Q40 104 40 92Z" fill="${OL}" ${st} stroke-width="3.500"/><path d="M40 84H120" stroke="${P}" stroke-width="2" opacity=".9"/><path d="M50 98l8-14M62 98l8-14M92 98l8-14M104 98l8-14" stroke="${C}" stroke-width="3" opacity=".85" stroke-linecap="butt"/>`:'';
  const hat=has('hat')?`<ellipse cx="80" cy="50" rx="40" ry="8" fill="${OL}" ${st} stroke-width="3"/><path d="M56 48L60 12H100L104 48Z" fill="${P}" ${st} stroke-width="3.500"/><path d="M57 40H103" stroke="${Y}" stroke-width="8"/><path d="M62 18H72" stroke="#fff" stroke-width="3" opacity=".6"/><ellipse cx="80" cy="12" rx="20" ry="4" fill="${mix(P,'#ffffff',.25)}" ${st} stroke-width="2.500"/>`:'';
  const crown=has('crown')?`<path d="M48 50L52 22L66 36L80 14L94 36L108 22L112 50Z" fill="${Y}" ${st} stroke-width="3.500"/><rect x="48" y="48" width="64" height="8" rx="2" fill="${O}" ${st} stroke-width="3"/><circle cx="80" cy="42" r="3.500" fill="${P}" ${st} stroke-width="2"/><circle cx="64" cy="46" r="2.500" fill="${C}" ${st} stroke-width="1.800"/><circle cx="96" cy="46" r="2.500" fill="${C}" ${st} stroke-width="1.800"/>`:'';
  const bow=has('bow')?`<path d="M108 52L130 40V66ZM108 52L88 42V64Z" fill="${P}" ${st} stroke-width="3"/><circle cx="108" cy="53" r="5.500" fill="${Y}" ${st} stroke-width="2.500"/>`:'';
  const starBadge=has('star')?`<path d="M118 78l3.500 7.500 8 1-6 5.500 1.600 8-7.100-4-7.100 4 1.600-8-6-5.500 8-1z" fill="${Y}" ${st} stroke-width="2.500"/>`:'';
  const clip=head==='starclip'?`<path d="M112 48l3.500 7.500 8 1-6 5.500 1.600 8-7.100-4-7.100 4 1.600-8-6-5.500 8-1z" fill="${Y}" ${st} stroke-width="2.500"/>`:'';
  const helmet=head==='helmet'?`<path d="M30 88Q26 16 80 14Q134 16 130 88L120 106Q80 120 40 106Z" fill="#BFF3FF" fill-opacity=".3" stroke="#fff" stroke-width="4"/><path d="M30 88Q26 16 80 14Q134 16 130 88" fill="none" stroke="${OL}" stroke-width="1.800" opacity=".7"/><path d="M42 40Q52 24 70 20M40 54q1-6 3-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/><path d="M34 106Q80 124 126 106V116Q80 134 34 116Z" fill="#DDE8FF" ${st} stroke-width="3.500"/>`:'';
  const descr=`Space courier, ${hs} hair, ${hg==='none'?'no headgear':hg+' headgear'}, ${ss} suit`;
  return `<svg viewBox="0 0 160 182" role="img" aria-label="${descr}" class="creature" xmlns="http://www.w3.org/2000/svg"><title>${descr}</title>${wings}${thinAnt}${arms}${body}${fins}${headShape}${hairShape}${face}${visor}${hat}${crown}${bow}${starBadge}${clip}${helmet}</svg>`;
};
window.dwarfSvg=function(u){return courierSvg(u)};
})();

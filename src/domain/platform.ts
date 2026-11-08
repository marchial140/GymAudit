import {Capacitor} from '@capacitor/core';
import {Clipboard} from '@capacitor/clipboard';
import {Share} from '@capacitor/share';
export const isNative=()=>Capacitor.isNativePlatform();
export async function copyReport(text:string){if(isNative())await Clipboard.write({string:text});else await navigator.clipboard.writeText(text);}
export async function shareReport(text:string){await Share.share({title:'Rapport GymAudit',text,dialogTitle:'Partager mon rapport GymAudit'});}

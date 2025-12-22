"use client";

import { useState } from "react";
import Avatar from "./avataaars-lib";

export interface AvatarConfig {
  topType: string;
  accessoriesType: string;
  hairColor: string;
  facialHairType: string;
  clotheType: string;
  clotheColor: string;
  eyeType: string;
  eyebrowType: string;
  mouthType: string;
  skinColor: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  topType: 'LongHairMiaWallace',
  accessoriesType: 'Prescription02',
  hairColor: 'BrownDark',
  facialHairType: 'Blank',
  clotheType: 'Hoodie',
  clotheColor: 'PastelBlue',
  eyeType: 'Happy',
  eyebrowType: 'Default',
  mouthType: 'Smile',
  skinColor: 'Light'
};

const OPTIONS = {
  topType: [
    'NoHair', 'Eyepatch', 'Hat', 'Hijab', 'Turban', 'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4', 
    'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy', 'LongHairDreads', 
    'LongHairFrida', 'LongHairFro', 'LongHairFroBand', 'LongHairNotTooLong', 'LongHairShavedSides', 
    'LongHairMiaWallace', 'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand', 'ShortHairDreads01', 
    'ShortHairDreads02', 'ShortHairFrizzle', 'ShortHairShaggyMullet', 'ShortHairShortCurly', 'ShortHairShortFlat', 
    'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides', 'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart'
  ],
  accessoriesType: [
    'Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers'
  ],
  hairColor: [
    'Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Platinum', 'Red', 'SilverGray'
  ],
  facialHairType: [
    'Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum'
  ],
  clotheType: [
    'BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck'
  ],
  clotheColor: [
    'Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White'
  ],
  eyeType: [
    'Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised', 'Wink', 'WinkWacky'
  ],
  eyebrowType: [
    'Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'UnibrowNatural', 'UpDown', 'UpDownNatural'
  ],
  mouthType: [
    'Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit'
  ],
  skinColor: [
    'Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'
  ]
};

interface AvatarPickerProps {
  value: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<keyof AvatarConfig>("topType");

  const handleChange = (key: keyof AvatarConfig, val: string) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center bg-muted/20 p-4 rounded-lg border border-border">
        <Avatar
          style={{ width: '150px', height: '150px' }}
          avatarStyle='Circle'
          {...value}
        />
      </div>

      <div className="space-y-2">
        <div className="flex overflow-x-auto gap-2 pb-2 border-b border-border no-scrollbar">
          {Object.keys(OPTIONS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as keyof AvatarConfig)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition-colors ${
                activeTab === key 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
          {OPTIONS[activeTab].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleChange(activeTab, opt)}
              className={`px-2 py-1.5 text-xs text-left truncate rounded border transition-colors ${
                value[activeTab] === opt
                  ? "border-primary bg-primary/20 text-primary font-medium shadow-sm"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50"
              }`}
              title={opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

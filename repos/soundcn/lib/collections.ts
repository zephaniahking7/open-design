import { cache } from "react";
import type { SoundCatalogItem } from "@/lib/sound-catalog";
import { getAllSounds } from "@/lib/sound-data";

export interface Collection {
	name: string;
	title: string;
	description: string;
	icon: string;
	disclaimer?: string;
}

export const COLLECTIONS: Collection[] = [
	{
		name: "warcraft",
		title: "World of Warcraft",
		description:
			"110 iconic sounds — interface chimes, NPC voices, combat impacts, dungeon doors, and ambient atmosphere from Blizzard's legendary MMORPG.",
		icon: "⚔️",
		disclaimer:
			"soundcn is not affiliated with, endorsed by, or associated with Blizzard Entertainment, Inc. World of Warcraft® is a registered trademark of Blizzard Entertainment, Inc. All sound assets from this collection are property of Blizzard Entertainment, Inc. and are shared here for non-commercial, educational purposes only.",
	},
];

export const getCollectionSounds = cache(
	(collectionName: string): SoundCatalogItem[] => {
		return getAllSounds().filter((s) => s.categories.includes(collectionName));
	},
);

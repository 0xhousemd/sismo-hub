import { BigNumberish } from "ethers";
import { NonEmptyArray } from "helpers";

export type Properties = {
  accountsNumber: number;
  tierDistribution: { [tier: number]: number };
};

export type GroupMetadata = {
  name: string;
  timestamp: number;
  generatedBy?: string;
  valueType: ValueType;
  accountSources: NonEmptyArray<AccountSource>;
  tags: Tags[];
  properties?: Properties;
};

export type GroupWithData = GroupMetadata & {
  data: FetchedData;
};

export type ResolvedGroupWithData = GroupMetadata & {
  data: FetchedData;
  resolvedIdentifierData: FetchedData;
};

export type Group = GroupMetadata & {
  data: () => Promise<FetchedData>;
  resolvedIdentifierData: () => Promise<FetchedData>;
};

export enum Tags {
  NFT = "NFT",
  Mainnet = "Mainnet",
  Asset = "Asset",
  User = "User",
  Vote = "Vote",
  POAP = "POAP",
  ENS = "ENS",
  Lens = "Lens",
  Web3Social = "Web3Social",
  SybilResistance = "SybilResistance",
  Eth2 = "Eth2",
  GitcoinGrant = "GitcoinGrant",
  GameJutsu = "GameJutsu",
  Twitter = "twitter",
  Factory = "Factory",
  BadgeHolders = "BadgeHolders",
  CoreTeam = "CoreTeam",
}

export enum AccountSource {
  ETHEREUM = "ethereum",
  GITHUB = "github",
  TWITTER = "twitter",
  TEST = "test",
  DEV = "dev",
}

export enum ValueType {
  // Score means the user can choose a lower score that the one in the data
  // this is designed to avoid doxing
  Score = "Score",
  // Info means the user need to select the exact data
  Info = "Info",
}

export type FetchedData = {
  [address: string]: BigNumberish;
};

export type GroupSearch = {
  groupName: string;
  latest?: boolean;
  timestamp?: number;
};

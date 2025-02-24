import readline from "readline";
import axios from "axios";
import { SocialAccount } from "./types";
import { UserData } from "@group-generators/helpers/data-providers/eth-leaderboard/types";
import { RESTProvider } from "@group-generators/helpers/data-providers/rest-api";
import { FetchedData } from "topics/group";

export class HiveProvider {
  restProvider: RESTProvider;
  url: string;

  public constructor() {
    this.url = "https://api.borg.id/";
    this.restProvider = new RESTProvider();
  }

  public async *getInfluencersFromClusterWithMinimumFollowers(
    clusterName: string,
    maxQueriedInfluencers = 10000,
    minimumNbOfFollowers = 0
  ) {
    // we have 50 results per page on Hive API
    let pageCounter = 0;
    let downloadNumber = 0;
    let lastSocialAccount: SocialAccount = {
      id: 0,
      personal_rank: 0,
      followers_count: 100000000000,
      name: "",
      screen_name: "",
    };
    do {
      const res = await axios({
        url: `${this.url}influence/clusters/${clusterName}/influencers/?page=${pageCounter}&sort_by=rank&sort_direction=asc`,
        method: "get",
        headers: {
          Authorization: `Token ${process.env.HIVE_API_KEY}`,
        },
      });

      for (const influencer of res.data.influencers) {
        const socialAccount =
          influencer.identity.social_accounts[0].social_account;
        lastSocialAccount = {
          id: socialAccount.id,
          personal_rank: influencer.personal_rank,
          followers_count: socialAccount.followers_count,
          name: socialAccount.name,
          screen_name: socialAccount.screen_name,
        };
        if (
          lastSocialAccount.followers_count >= minimumNbOfFollowers &&
          lastSocialAccount.personal_rank <= maxQueriedInfluencers
        ) {
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(`downloading ... (${downloadNumber})`);
          downloadNumber++;
          yield lastSocialAccount;
        }
      }
      pageCounter++;
    } while (pageCounter < maxQueriedInfluencers / 50);
  }

  public async getTwitterAccountsInCluster(
    clusterName: string,
    maxQueriedInfluencers = 10000,
    defaultValue = 1
  ): Promise<FetchedData> {
    const twitterAccounts: FetchedData = {};
    for await (const account of this.getInfluencersFromClusterWithMinimumFollowers(
      clusterName,
      maxQueriedInfluencers
    )) {
      twitterAccounts[`twitter:${account.screen_name}:${account.id}`] =
        defaultValue;
    }
    return twitterAccounts;
  }

  public async getInfluencersAboveMaxRank(
    influencers: UserData[],
    maxRank: number,
    clusterNames: string[] = ["Ethereum"]
  ): Promise<string[]> {
    const hiveFetchFunction = async (user: UserData): Promise<string> => {
      try {
        const res = await this.restProvider.fetchData({
          url: `${this.url}/influence/influencers/twitter:${user.handle}/`,
          method: "get",
          headers: {
            Authorization: `Token ${process.env.HIVE_API_KEY}`,
          },
        });
        const json = JSON.parse(JSON.stringify(res));
        // if the influencer belongs to `clusterName` cluster (e.g. Ethereum cluster on Hive: https://hive.one/c/ethereum)
        // we check that his rank is above maxRank
        // if true we return his ens
        if (json["clusters"]) {
          let index = 0;
          for (const cluster of json["clusters"]) {
            if (clusterNames.includes(cluster.name)) {
              if (parseInt(json["latest_scores"][index].rank) < maxRank) {
                return user.ens;
              }
            }
            index++;
          }
        }
        // else we return an empty string
        return "";
      } catch (error) {
        // else we return an empty string
        return "";
      }
    };

    // we query Hive API with eth leaderboard data
    const ensAccountsExistingonHive = await this.restProvider.withConcurrency(
      influencers,
      hiveFetchFunction,
      { concurrency: 10 }
    );

    return ensAccountsExistingonHive;
  }
}

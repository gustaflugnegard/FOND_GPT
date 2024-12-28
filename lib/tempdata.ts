import { createClient } from "@/utils/supabase/client";

const supabase = createClient()

export async function getAssetprice() {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("asset_price").select('*');
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }
    return fonds;
};

export async function getForandring() {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("count").select('*');
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }
    return fonds;
};

export async function getScatter() {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("scatter").select('*');
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }
    return fonds;
};

export async function gettop5() {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("historical_return_top5").select('*');
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }
    return fonds;
};

export async function getAssetCount() {
    const { data, error } = await supabase.rpc("get_top_isins");

    if (error) {
        console.error("Error fetching aggregated data from function:", error);
        return [];
    }

    return data;
}

export async function getBranschCount() {
    const { data, error } = await supabase.rpc("get_top_sektors");

    if (error) {
        console.error("Error fetching aggregated data from function:", error);
        return [];
    }

    return data;
}

export async function getlanderCount() {
    const { data, error } = await supabase.rpc("get_top_lander");

    if (error) {
        console.error("Error fetching aggregated data from function:", error);
        return [];
    }

    return data;
}

export async function getavgifterCount() {
    const { data, error } = await supabase.rpc("get_top_avgifter");

    if (error) {
        console.error("Error fetching aggregated data from function:", error);
        return [];
    }

    return data;
}

export async function getBranch() {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("concat_data").select('*');
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }
    return fonds;
};

// världskartan över alla fonder
export async function getAlland() {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("relation").select('isin, land');
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }

    const removecopies = Array.from(
        fonds.reduce((map: Map<string, { isin: string; land: string }>, item: { isin: string; land: string }) => {
            map.set(item.isin, item);
            return map;
        }, new Map<string, { isin: string; land: string }>())
    ).map(([_, value]) => value);

    return removecopies;
};

// världskartan över varje fond
export async function getLand(fond: string) {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("relation").select('land').eq("fond", fond);
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }
    return Array.from(fonds.map(e => e.land));
}

// bransch i varje fond
export async function getBranscher(fond: string) {
    console.log("rq to db")
    const { data: fonds } = await supabase.from("relation").select('branch').eq("fond", fond);
    if (!fonds) {
        console.error("Error fetching data");
        return [];
    }
    return Array.from(fonds.map(e => e.branch));
}

//innehav i varje fond
export async function getInnehav(fond: string) {

    const { data: fonds } = await supabase.from("relation").select().eq("fond", fond);
    return fonds;

}
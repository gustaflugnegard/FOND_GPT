import { createClient } from "@/utils/supabase/server";


export async function getFondinfo(fond: string) {
    const supabase = createClient();
    const { data: fonds } = await supabase.from("fonder").select().eq("fond", fond);
    if (!fonds) {
        console.log("fonds emptpy, fel i getFondinfo")
        return {}
    }

    return {
        Namn: fonds[0].fond,
        Bolag: fonds[0].bolag,
        ISIN: fonds[0].isin,
        fondformogenhet: fonds[0].fondformogenhet,
        oneyear: fonds[0].oneyear,
        likvida: fonds[0].likvida,
        ovriga: fonds[0].ovriga,
        risk: fonds[0].risk,
        std: fonds[0].stdavvikelse,
        typer: fonds[0].tillgangsslag
    }
}


export async function getInnehav(fond: string) {

    const supabase = createClient();
    const { data: fonds } = await supabase.from("relation").select().eq("fond", fond);
    return fonds;

}

let branschlist: string[];
export async function getBransch(fond: string) {

    if (branschlist != null)
        return branschlist;

    const supabase = createClient();
    const { data: fonds } = await supabase.from("relation").select("branch").eq("fond", fond);
    console.log("rq to db")
    if (!fonds) {
        console.error("fonds emptpy")
        return [];
    }
    branschlist = fonds.map(e => e.branch)
    return branschlist;

}

export async function getLand(fond: string) {

    const supabase = createClient();
    const { data: fonds } = await supabase.from("relation").select("land").eq("fond", fond);
    console.log("rq to db")
    if (!fonds) {
        console.error("fonds emptpy")
        return [];
    }
    return Array.from(fonds.map(e => e.land));

}

let savedlist: string[];
export async function getFondlist() {

    if (savedlist != null) {
        return savedlist;
    }
    console.log("rq to db")
    const supabase = createClient();
    const { data: fonds } = await supabase.from("fonder").select("fond");
    if (!fonds) {
        console.error("fonds emptpy")
        return [];
    }
    savedlist = Array.from(fonds.map(e => e.fond));
    return savedlist;
}

export async function getFiltreradFondlista(query: string) {
    const fondlist = await getFondlist();
    return fondlist.filter((e: string) => e.toLowerCase().includes(query.toLowerCase()))
}

export interface aktie {
    aktie: string,
    isin: string,
    ticker: string
}

let aktielista: aktie[];
export async function getAktielista() {


    if (aktielista != null) {
        return aktielista;
    }
    console.log("rq to db")
    const supabase = createClient();
    const { data: fonds } = await supabase.from('aktier').select('isin, ticker, aktie')
    console.log("db length: ", fonds?.length)
    if (!fonds) {
        console.error("fonds emptpy")
        return [];
    }

    aktielista = fonds;

    //console.log(aktielista);
    return aktielista;
}

export async function getFiltreradAktielista(query: string) {
    const aktielist = await getAktielista();
    return aktielist.filter((e: aktie) => e.aktie.toLowerCase().includes(query.toLowerCase()))
}

export interface fond {
    fond: string,
    oneyear: string,
    fondformogenhet: string,
    likvida: string,
    ovriga: string,
    risk: string,
    stdavvikelse: string
}

let fondlista: fond[];
export async function getFonderlista() {
    if (fondlista != null) {
        return fondlista;
    }
    console.log("rq to db")
    const supabase = createClient();
    const { data: fonds } = await supabase.from("fonder").select('fond, oneyear, fondformogenhet, likvida, ovriga, risk, stdavvikelse');
    if (!fonds) {
        console.error("fonds emptpy")
        return [];
    }
    console.log(fonds.length)
    fondlista = fonds;
    return fondlista;
}

export interface aktieview {
    isin: string,
    aktie: string,
    fondcount: number
}

let nbraktier: aktieview[];
export async function getAktieView() {
    if (nbraktier != null) {
        return nbraktier;
    }
    console.log("rq to db")
    const supabase = createClient();
    const { data: fonds } = await supabase.from("aktierlongest").select('isin, aktie, fondcount');
    if (!fonds) {
        console.error("fonds emptpy")
        return [];
    }
    nbraktier = fonds;
    return nbraktier;
}

export type Comment = {
    id: string | null,
    topic_id: string | any,
    created_at: string | null,
    user: string,
    message: string
}

export type Topic = {
    id: string | null,
    created_at: string | null,
    title: string,
    user: string,
    message: string
}

export async function getLastMessages(topicid: string) {

    const supabase = createClient();
    const { data: messages, error } = await supabase
        .from("comments")
        .select("*")
        .eq("topic_id", topicid)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("Error fetching comments:", error);
    }

    if (!messages) {
        console.error("Fetched no messages from database");
        return [];
    }

    return messages.reverse();
}

export async function getAllTopics() {
    const supabase = createClient();
    const { data: topics, error } = await supabase
        .from("topics")
        .select("*");

    if (!topics) {
        return [];
    }

    return topics;
}

export async function sendChat(chat: Comment) {
    const supabase = createClient();
    await supabase.from("comments").insert(
        {
            user: chat.user,
            message: chat.message,
            topic_id: chat.topic_id,
        }
    );
}
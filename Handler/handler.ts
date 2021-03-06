import { Client, Collection, CollectorFilter, DataResolver, Message, PresenceStatusData, MessageEmbed, TextBasedChannel, ActivityType, TextChannel, GuildMember, User, Guild, MessageAttachment, FileOptions, BufferResolvable, Snowflake, Interaction, ApplicationCommand } from "discord.js"

import * as fs from "fs"

import got from "got"

type Activities = "PLAYING" | "STREAMING" | "LISTENING" | "WATCHING" | "COMPETING"

let collection: Collection<any, any> = new Collection()

import * as dotenv from "dotenv"

import * as duration from "humanize-duration"
dotenv.config()
let count = 0
import * as mongoose from "mongodb"
import { isConstructorDeclaration, resolveProjectReferencePath } from "typescript"
import { Db } from "mongodb"

import collections from "./collectionHandler.js"

let MyCollection = new collections()
/// <reference path="./Typings/index.d.ts"/>
export default class Handler {
    public prefix: string | string[]
    public commandDir: string
    public commandFiletype: string
    public client: Client
    public default_prefix: string
    /**
     * Constructor to login to your bot
     * @param client - The client variable
     * @param prefix - Your prefix
     * @param commandDir - The path to your command file
     * @param commandFiletype - The filetype you want to only look in your command file
     */
    constructor(
        client: Client, prefix: string | string[], commandDir?: string, commandFiletype?: string, eventFile?: string) {
        if(!client) {
            throw new Error("Please initiate a client")
        } else {
            this.client = client
        }
        if(!process.env.TOKEN) {
            throw new Error("Please make sure you have made an environment variable for your token.")
        } else {
            client.login(process.env.TOKEN)
        }
        if(!prefix) {
            this.default_prefix = "-"
        } else {
            this.prefix = prefix
        }
        if(commandDir) {
            if(commandFiletype) {
                this.commandDir = commandDir
                this.commandFiletype = commandFiletype
            }
        }
        if(eventFile) {
            fs.readdir(eventFile, (err, file) => {
                file.filter(file => file.endsWith(".js")).forEach(files => {
                    let fileName = files.split(".")[0]
                    let event = require(`./events/${fileName}`)
                    client.on(fileName, (...args) => event.execute(client, this, MyCollection, ...args))
                })
            })
        }
    }
    /**
     * This method runs the command files from the folder you specified in the constructor that if it finds your message arguments equals to the command.name or one of the aliases of the command. You can access the help command by -help
     * @param msg - The Message object
     * @param execute - If you want to execute the file
     */
    runCommand(msg: Message) {
        if(typeof this.commandDir !== "string") {
            throw new TypeError("option command must be type string")
        } else {
            if(fs.statSync(this.commandDir).isDirectory()) {
                if(this.commandFiletype) {
                    let default_filetype: string = ".js"
                    let commandFolder = fs.readdirSync(this.commandDir).filter(w => w.endsWith(!this.commandFiletype ? default_filetype : this.commandFiletype))
                    for(let file of commandFolder) {
                        let command = require(`${this.commandDir}/${file}`)
                        collection.set(command.name, command)
                    }
                    let mapped_collection = collection
                    let args = this.setArgs(msg, { splitby: / +/g})
                    let command = collection.get(args[0]) || collection.find(command => command.aliases?.some(w => w === args[0]))
                    if(Array.isArray(this.prefix)) {
                        if(this.prefix.some(w => msg.content.startsWith(w))) {
                            if(command && /[a-zA-Z]{1}/gim.test(args[0])) {
                                if(command?.slash) return;
                                if(command.disable && command.hasOwnProperty("disable")) return this.messageSend(msg, {
                                    embed: {
                                        title: "Command Disabled",
                                        description: `${msg.author.toString()}: Unfortunately the owner of this bot disabled this command`,
                                        color: "#FF0000"
                                    }
                                }, { botMessageDelete: true, timeout: 5000 })
                                if(!command?.guildOnly) return command.execute(msg, args, this, mapped_collection, MyCollection)
                                if(command.guildOnly && command.hasOwnProperty("guildOnly") && msg.channel.type === "dm") return this.messageSend(msg, {
                                    embed: {
                                        title: "Guild Only",
                                        description: `${msg.author.toString()}: This command is only available in the server`,
                                        color: "FF0000"
                                    }
                                }, { dm: true})
                                if(msg.author.id === "576894343122649098") return command.execute(msg, args, this, mapped_collection, MyCollection)
                                if(!msg.member.roles.cache.some(role => command?.requiredRoles?.includes(role.id)) && command?.requiredRoles) return this.messageSend(msg, {
                                    embed: {
                                        title: "Roles Required",
                                        description: `${msg.author.toString()}: You don't have the roles required for this command.\nRequired: ${command?.requiredRoles?.map(role => `<@&${role}>`).join(", ")}`,
                                        color: "#FF0000"
                                    }
                                }, { delete: true, botMessageDelete: true, timeout: 1000 * 12}) 
                                if(!msg.member.permissions.has(command?.permissions) && command?.permissions) return this.messageSend(msg, {
                                    embed: {
                                        title: "Perms Required",
                                        description: `${msg.author.toString()}: You don't have the perms required for this command.\nRequired: ${command?.permissions?.map(perms => perms).map(", ")}`
                                    }
                                }, { delete: true, timeout: 1000 * 12, botMessageDelete: true})
                                return command.execute(msg, args, this, mapped_collection, MyCollection)
                            }
                        }
                    } else {
                        if(msg.content.startsWith(this.prefix)) {
                            if(command && /[a-zA-Z]{1}/gim.test(args[0])) {
                                if(command?.slash) return;
                                if(command.disable && command.hasOwnProperty("disable")) return this.messageSend(msg, {
                                    embed: {
                                        title: "Command Disabled",
                                        description: `${msg.author.toString()}: Unfortunately the owner of this bot disabled this command`,
                                        color: "#FF0000"
                                    }
                                }, { botMessageDelete: true, timeout: 5000 })
                                if(!command?.guildOnly) return command.execute(msg, args, this, mapped_collection, MyCollection)
                                if(command?.guildOnly && command.hasOwnProperty("guildOnly") && msg.channel.type === "dm") return this.messageSend(msg, {
                                    embed: {
                                        title: "Guild Only",
                                        description: `${msg.author.toString()}: This command is only available in the server`,
                                        color: "FF0000"
                                    }
                                }, { dm: true})
                                if(msg.author.id === "576894343122649098") return command.execute(msg, args, this, mapped_collection, MyCollection)
                                if(!msg.member.roles.cache.some(role => command?.requiredRoles?.includes(role.id)) && command?.requiredRoles) return this.messageSend(msg, {
                                    embed: {
                                        title: "Roles Required",
                                        description: `${msg.author.toString()}: You don't have the roles required for this command.\nRequired: ${command?.requiredRoles?.map(role => `<@&${role}>`).join(", ")}`,
                                        color: "#FF0000"
                                    }
                                }, { delete: true, botMessageDelete: true, timeout: 1000 * 12}) 
                                if(!msg.member.permissions.has(command?.permissions) && command?.permissions) return this.messageSend(msg, {
                                    embed: {
                                        title: "Perms Required",
                                        description: `${msg.author.toString()}: You don't have the perms required for this command.\nRequired: ${command?.permissions?.map(perms => perms).map(", ")}`
                                    }
                                }, { delete: true, timeout: 1000 * 12, botMessageDelete: true})
                                return command.execute(msg, args, this, mapped_collection, MyCollection)
                            } 
                        }
                    }
                } 
            } else {
                throw new Error("The directory you provided is not a directory")
            }
        }
    }
    /**
     * Does args automatically for u
     * @param msg - The message object
     * @param options - The options for your args
     * @returns
     */
    setArgs(msg: Message, options?: {splitby: string | RegExp}) {
        if(!options) return msg.content
        return options.splitby ? msg.content.slice(1).split(options.splitby) : msg.content.slice(1)
    }
    /**
     * Math command
     * @param math - The first number
     * @param math1 - The second number
     * @param options.operations - The operation you want to do
     */
    mathCommand(math: number, math1: number, options: { operations: string }) {
        if(options.operations === "multiplication") {
            if(!isNaN(math) && !isNaN(math1)) {
                return math * math1
            } else {
                console.log("I cannot multiply non-numbers")
            }
        } else if(options.operations === "division") {
            if(!isNaN(math) && !isNaN(math1)) {
                return math / math1
            } else {
                console.log("I cannot multiply non-numbers")
            }
        } else if(options.operations === "subtraction") {
            if(!isNaN(math) && !isNaN(math1)) {
                return math - math1
            } else {
                console.log("I cannot multiply non-numbers")
            }
        } else if(options.operations === "addition") {
            if(!isNaN(math) && !isNaN(math1)) {
                return math + math1
            } else {
                console.log("I cannot multiply non-numbers")
            }
        }
    }
    /**
     * This is a reaction collector
     * @param msg - The message object
     * @param reactions - Reactions you want the bot to react to your message
     * @param filter - The filter. Writing "everyone" will accept everyone reactions, else won't
     * @param collectorOptions - The options for the collector
     * @returns
     */
    reactionCollector(msg: Message, reactions: string | string[], filter: any, collectorOptions: {time: number}) {
        if(!msg.guild) throw new Error("Seems like the collector is done inside a DM")
        if(Array.isArray(reactions) && typeof reactions !== "number") {
            for (let emojis of reactions) {
                msg.react(emojis)
            }
            let filters: CollectorFilter<any>; 
            if(filter === "everyone" || filter === "") {
                filters = (reaction, user) => reactions.some(w => w === reaction.emoji.name || reaction.emoji.id) && !user.bot
            } else {
                filters = (reaction, user) => reactions.some(w => w === reaction.emoji.name || reaction.emoji.id) && !user.bot && user.id === filter
            }
            return msg.awaitReactions(filters, collectorOptions)
        } else if(typeof reactions === "number") {
            throw new TypeError("Please make sure you didn't put a number for reactions")
        } else {
            let filters: CollectorFilter<any> = (reaction, user) => reaction.emoji.name === reactions && !user.bot && user.id === filter
            msg.react(reactions)
            return msg.awaitReactions(filters, collectorOptions)
        }
    }
    /**
     * Simple function for sending a message in discord
     * @param msg - The Message object
     * @param message - The message you want to send
     * @param options - options for you message send
     */
    messageSend(msg: Message, message: string | MessageEmbed | any, options?: { reply?: boolean, channelID?: string, dm?: boolean, delete?: boolean, botMessageDelete?: boolean, timeout?: number, picture?: any}) {
        if(options?.dm) return msg.author.send(message).catch(() => msg.channel.send(`<@${msg.author.id}>: Your DM is priv, pls open it so I can send it to you`))
        if(options) {
            options.delete ? msg.delete().catch(() => undefined) : null
            if(options?.reply) return msg.reply(message).then(m => {
                if(options.botMessageDelete) {
                    if(typeof options.timeout !== "number" && options.timeout) throw new TypeError("Timeout must be type number")
                    setTimeout(() => m.delete().catch(() => undefined), options.timeout ? options.timeout : 1000 * 5)
                }
            })
            if(options.channelID) {
                if(typeof options.channelID !== "string") throw new TypeError("Channel ID must be type string")
                if(!/\d{17,18}/gim.test(options.channelID)) throw new Error("Channel ID must be 17,18 in length")
                let channel = <TextChannel>this.client.channels.cache.get(options.channelID)
                channel.send(message).then(m => {
                    setTimeout(() => {
                        if(options.botMessageDelete) {
                            m.delete()
                        }
                    }, typeof options.timeout && options.timeout ? options.timeout : 5000)
                }).catch((err) => console.log(err))
            } else {
                msg.channel.send(message).then(m => {
                    setTimeout(() => {
                        if(options.botMessageDelete) {
                            m.delete()
                        }
                    }, typeof options.timeout && options.timeout ? options.timeout : 5000)
                })
            }
        } else {
            msg.channel.send(message)
        }
    }
    /**
     * Randomizes responses for you automatically
     * @param msg - The message object
     * @param response - Thw response(s) you want your bot to send in a random matter
     * @returns randomized strings
     */
    responseRandomizer(msg: Message, response: string | string[]) {
        if(Array.isArray(response)) {
            return msg.channel.send(response[Math.floor(Math.random() * response.length)])
        } else {
            return msg.channel.send(response)
        }
    }
    /**
     * This function set the status of your bot to whatever you want. Must be used inside a ready event.
     * @param activity - Whether you want an activity or not.
     * @param statusMessage - The message you want your bot to show in their status, or the url to your twitch if type is equals to 1 or STREAMING
     * @param statusType - The activity type
     * @param status - If you want your bot to show as online, dnd, offline.
     * @returns Sets your bot Presence.
     */
    setStatus(activity: boolean, statusMessage: string, statusType: number | Activities, status?: PresenceStatusData) {
        MyCollection.set("Bot_uptime", Date.now())
        if(activity) {
            if(statusMessage) {
                if(statusType === 1 || statusType === "STREAMING") {
                    return this.client.user.setPresence({
                        activities: [
                            {
                                url: statusMessage,
                                type: "STREAMING"
                            }
                        ],
                        status: status
                    })
                } else {
                    return this.client.user.setPresence({
                        activities: [
                            {
                                name: statusMessage,
                                type: statusType
                            }
                        ]
                    })
                }
            } else {
                return this.client.user.setPresence({
                    activities: [
                        {
                            name: "Seems like you dont have custom status sete, so I'll set it for you",
                            type: "PLAYING"
                        },
                    ],
                    status: "idle"
                })
            }
        }
    }
    /**
     * This method checks the covid stat for the country you specified
     * @param msg - The message object
     * @param arg - The country you want to check the covid stats on
     * @returns
     */
    async covidStat(msg: Message, arg: string) {
        return got.get(`https://covid2019-api.herokuapp.com/v2/country/${encodeURIComponent(arg.charAt(0).toUpperCase() + arg.replace(arg.charAt(0), ""))}`).then(m => {
            const content = JSON.parse(m.body)
            const covid_embed = new MessageEmbed()
            .setTitle(content.data.location ?? "Location not Found")
            .setColor("RED")
            .setAuthor("Covid Stats", msg.guild.iconURL())
            .setThumbnail("https://images.newscientist.com/wp-content/uploads/2020/02/11165812/c0481846-wuhan_novel_coronavirus_illustration-spl.jpg")
            .addFields(
                { name: "Cases", value: content.data.confirmed ?? "Location not Found", inline: true},
                { name: "Death", value: content.data.deaths ?? "Location not Found", inline: true},
                { name: "Recovered", value: content.data.recovered ?? "Location not Found"},
                { name: "Active Cases", value: content.data.active ?? "Location not Found"}
            )
            .setFooter(`Last Updated ${content.dt}`)

            msg.channel.send(covid_embed)
        })
    }
    /**
     * A method to automatically do clean command for you with some options
     * @param msg - The message object
     * @param count - The count of how many messages you want to be deleted
     * @param options - The options, if nuke is set to true it will clone the channel with the same stuff as the old one, I do this to prevent API spam
     */
    async cleanCommand(msg: Message, count: number, options: { nuke: boolean}) {
        if(!msg) throw new Error("Please specify something in the channel parameter")
        if(msg.channel.type === "text") {
            if(options.nuke) {
                if(msg.author.id !== "576894343122649098") return this.messageSend(msg, `${msg.author}: Only the owner can mute`, { delete: true, botMessageDelete: true, timeout: 5000})
                return msg.channel.clone().then(channel => {
                    msg.channel.delete()
                    channel.send(`<@${msg.member.id}>: You've nuked the last channel so I cloned it and created a new one`)
                })
            } else {
                if(msg.guild.me.permissions.has("MANAGE_MESSAGES")) {
                    if(count >= 1 && count <= 100 && !isNaN(count)) {
                        await msg.delete()
                        msg.channel.bulkDelete(count).then(message => {
                            if(message.size <= 1) {
                                this.messageSend(msg, `Deleted ${message.size} message`, { delete: false, botMessageDelete: true, timeout: 5000})
                            } else {
                                this.messageSend(msg, `Deleted ${message.size} messages`, { delete: false, botMessageDelete: true, timeout: 5000})
                            }
                        })
                    } else if(isNaN(count)) {
                        this.messageSend(msg, `<@${msg.member.id}>: You specified a Not a Number value`, { delete: true, botMessageDelete: true, timeout: 5000})
                    } else if(count > 100) {
                        this.messageSend(msg, `<@${msg.member.id}>: You cannot delete that much messages`, { delete: true, botMessageDelete: true, timeout: 5000})
                    } else {
                        this.messageSend(msg, `<@${msg.member.id}>: The delete count cannot be less than 1`, { delete: false, botMessageDelete: true, timeout: 5000})
                    }
                } else {
                    return msg.channel.send(`${msg.author}: Seems like I don't have permission to do this command`)
                }
            }
        }
    }
    /**
     * Just a simple user fetcher
     * @param msg - The Message or Guild object to be used as a fetcher
     * @param user - If you want to fetch a User or a GuildMember
     * @param id - The ID of the User or GuildMember to fetch
     */
    fetcher(msg: Message | Guild, user: boolean, id?: string): Promise<GuildMember> | Promise<User> | Promise<Collection<Snowflake, GuildMember>> {
        if(!msg) throw new Error("Required a Message obj or something that can be used to fetch a user")
        if(typeof id !== "string") throw new TypeError("Requires ID to be string")
        if(/\d{17,18}/gim.test(id)) throw new RangeError("Length of ID must be 17,18 in length")
        if(user) {
            if(!id) throw new Error("ID is required for User fetching")
            return this.client.users.fetch(id)
        } else {
            if(msg instanceof Message) {
                return msg.guild.members.fetch(id)
            } else {
                return msg.members.fetch(id)
            }
        }
    }
    /**
     * Just a epochConverter time converter
     * @param time - The date time you want to convert
     */
     epochConverter(time: number, options?: { age?: boolean, boost?: boolean}) {
        if(!time) throw new Error("Please specify a time and make sure it is type number")
        if(/\d{13}/gim.test(time.toString())) {
            if(options?.age && !options?.boost) {
                let date = Math.abs(Date.now() - time)
                let years = Math.floor(date / 1000 / 60 / 60 / 24 / 365)
                let months = Math.floor(date / 1000 / 60 / 60 / 24 / 30)
                let days = Math.floor(date / 1000 / 60 / 60 / 24)
                let hours = Math.floor(date / 1000 / 60 / 60)
                let minutes = Math.floor(date / 1000 / 60)
                let seconds = Math.floor(date / 1000)
                if(date >= 1000 * 60 * 60 * 24 * 365 && date <= 1000 * 60 * 60 * 24 * 730) {
                    return Date.now() > date ? "A year" : "In a year"
                } else if(date >= 1000 * 60 * 60 * 24 * 30 && date <= 1000 * 60 * 60 * 24 * 60) {
                    return Date.now() > date ? "A month" : "In a month"
                } else if(date >= 1000 * 60 * 60 * 24 * 7 && date <= 1000 * 60 * 60 * 24 * 14) {
                    return Date.now() > date ? "A week" : "In a week"
                } else if(date >= 1000 * 60 * 60 && date <= 1000 * 60 * 60 * 2) {
                    return Date.now() > date ? "An hour" : "In an hour"
                } else if(date >= 1000 * 60 && date <= 1000 * 60 * 2) {
                    return Date.now() > date ? "A minute" : "In a minute"
                } else if(date >= 1000 && date <= 1000 * 20) {
                    return Date.now() > date ? "A moment" : "In a moment"
                } else {
                    return `${years >= 1 ? `${years} year${years <= 1 ? "" : "s"}` : ""}${months >= 1 && months <= 12 ? `${months} month${months <= 1 ? "" : "s"}` : ""}${days >= 1 && days <= 30 ? `${days} day${days <= 1 ? "" : "s"}` : ""}${hours >= 1 && hours <= 24 ? `${hours} hour${hours <= 1 ? "" : "s"}` : ""}${minutes >= 1 && minutes <= 60 ? `${minutes} minute${minutes <= 1 ? "" : "s"}` : ""}${seconds >= 1 && seconds <= 60 ? `${seconds} second${seconds <= 0 ? "" : "s"}` : ""}`
                }
            } else if(options?.boost) {
                let date = Math.abs(Date.now() - time)
                let years = Math.floor(date / 1000 / 60 / 60 / 24 / 365)
                let months = Math.floor(date / 1000 / 60 / 60 / 24 / 30)
                let days = Math.floor(date / 1000 / 60 / 60 / 24)
                let hours = Math.floor(date / 1000 / 60 / 60)
                let minutes = Math.floor(date / 1000 / 60)
                let seconds = Math.floor(date / 1000)
                return `For ${years >= 1 ? `${years} year${years <= 1 ? "" : "s"}` : ""}${months >= 1 && months <= 12 ? `${months} month${months <= 1 ? "" : "s"}` : ""}${days >= 1 && days <= 30 ? `${days} day${days <= 1 ? "" : "s"}` : ""}${hours >= 1 && hours <= 24 ? `${hours} hour${hours <= 1 ? "" : "s"}` : ""}${minutes >= 1 && minutes <= 60 ? `${minutes} minute${minutes <= 1 ? "" : "s"}` : ""}${seconds >= 1 && seconds <= 60 ? `${seconds} second${seconds <= 0 ? "" : "s"}` : ""}`
            } else {
                let date = Math.abs(Date.now() - time)
                let years = Math.floor(date / 1000 / 60 / 60 / 24 / 365)
                let months = Math.floor(date / 1000 / 60 / 60 / 24 / 30)
                let days = Math.floor(date / 1000 / 60 / 60 / 24)
                let hours = Math.floor(date / 1000 / 60 / 60)
                let minutes = Math.floor(date / 1000 / 60)
                let seconds = Math.floor(date / 1000)
                if(date >= 1000 * 2 && date <= 1000 * 60) {
                    return Date.now() > date ? "A moment ago" : "In a moment"
                } else if(date >= 1000 * 60 * 1 && date <= 1000 * 60 * 3) {
                     return Date.now() > date ? "A minute ago" : "In a minute"
                } else if(date >= 1000 * 60 * 60 * 1 && date <= 1000 * 60 * 60 * 2) {
                    return Date.now() > date ? "An hour ago" : "In an hour"
                } else if(date >= 1000 * 60 * 60 * 24 * 7 && date <= 1000 * 60 * 60 * 24 * 14) {
                    return Date.now() > date ? "A week ago" : "In a week"
                } else {
                    return `${Date.now() < time ? "In " : ""}${years >= 1 ? `${years} year${years <= 1 ? "" : "s"}` : ""}${months >= 1 && months <= 12 ? `${months} month${months <= 1 ? "" : "s"}` : ""}${days >= 1 && days <= 30 ? `${days} day${days <= 1 ? "" : "s"}` : ""}${hours >= 1 && hours <= 24 ? `${hours} hour${hours <= 1 ? "" : "s"}` : ""}${minutes >= 1 && minutes <= 60 ? `${minutes} minute${minutes <= 1 ? "" : "s"}` : ""}${seconds >= 1 && seconds <= 60 ? `${seconds} second${seconds <= 0 ? "" : "s"}` : ""}${Date.now() > time ? " ago" : ""}`
                }
            }
        } else {
            if(options?.age && !options?.boost) {
                let date = Math.abs(Date.now() - time * 1000)
                let years = Math.floor(date / 1000 / 60 / 60 / 24 / 365)
                let months = Math.floor(date / 1000 / 60 / 60 / 24 / 30)
                let days = Math.floor(date / 1000 / 60 / 60 / 24)
                let hours = Math.floor(date / 1000 / 60 / 60)
                let minutes = Math.floor(date / 1000 / 60)
                let seconds = Math.floor(date / 1000)
                if(date >= 1000 * 60 * 60 * 24 * 365 && date <= 1000 * 60 * 60 * 24 * 730) {
                    return Date.now() > date ? "A year" : "In a year"
                } else if(date >= 1000 * 60 * 60 * 24 * 30 && date <= 1000 * 60 * 60 * 24 * 60) {
                    return Date.now() > date ? "A month" : "In a month"
                } else if(date >= 1000 * 60 * 60 * 24 * 7 && date <= 1000 * 60 * 60 * 24 * 14) {
                    return Date.now() > date ? "A week" : "In a week"
                } else if(date >= 1000 * 60 * 60 && date <= 1000 * 60 * 60 * 2) {
                    return Date.now() > date ? "An hour" : "In an hour"
                } else if(date >= 1000 * 60 && date <= 1000 * 60 * 2) {
                    return Date.now() > date ? "A minute" : "In a minute"
                } else if(date >= 1000 && date <= 1000 * 20) {
                    return Date.now() > date ? "A moment" : "In a moment"
                } else {
                    return `${years >= 1 ? `${years} year${years <= 1 ? "" : "s"}` : ""}${months >= 1 && months <= 12 ? `${months} month${months <= 1 ? "" : "s"}` : ""}${days >= 1 && days <= 30 ? `${days} day${days <= 1 ? "" : "s"}` : ""}${hours >= 1 && hours <= 24 ? `${hours} hour${hours <= 1 ? "" : "s"}` : ""}${minutes >= 1 && minutes <= 60 ? `${minutes} minute${minutes <= 1 ? "" : "s"}` : ""}${seconds >= 1 && seconds <= 60 ? `${seconds} second${seconds <= 0 ? "" : "s"}` : ""}`
                }
            } else if(options?.boost) {
                let date = Math.abs(Date.now() - time)
                let years = Math.floor(date / 1000 / 60 / 60 / 24 / 365)
                let months = Math.floor(date / 1000 / 60 / 60 / 24 / 30)
                let days = Math.floor(date / 1000 / 60 / 60 / 24)
                let hours = Math.floor(date / 1000 / 60 / 60)
                let minutes = Math.floor(date / 1000 / 60)
                let seconds = Math.floor(date / 1000)
                return `For ${years >= 1 ? `${years} year${years <= 1 ? "" : "s"}` : ""}${months >= 1 && months <= 12 ? `${months} month${months <= 1 ? "" : "s"}` : ""}${days >= 1 && days <= 30 ? `${days} day${days <= 1 ? "" : "s"}` : ""}${hours >= 1 && hours <= 24 ? `${hours} hour${hours <= 1 ? "" : "s"}` : ""}${minutes >= 1 && minutes <= 60 ? `${minutes} minute${minutes <= 1 ? "" : "s"}` : ""}${seconds >= 1 && seconds <= 60 ? `${seconds} second${seconds <= 0 ? "" : "s"}` : ""}`
            } else {
                let date = Math.abs(Date.now() - time * 1000)
                let years = Math.floor(date / 1000 / 60 / 60 / 24 / 365)
                let months = Math.floor(date / 1000 / 60 / 60 / 24 / 30)
                let days = Math.floor(date / 1000 / 60 / 60 / 24)
                let hours = Math.floor(date / 1000 / 60 / 60)
                let minutes = Math.floor(date / 1000 / 60)
                let seconds = Math.floor(date / 1000)
                if(date >= 1000 * 2 && date <= 1000 * 60) {
                    return Date.now() > date ? "A moment ago" : "In a moment"
                } else if(date >= 1000 * 60 * 1 && date <= 1000 * 60 * 3) {
                    return Date.now() > date ? "A minute ago" : "In a minute"
                } else if(date >= 1000 * 60 * 60 * 1 && date <= 1000 * 60 * 60 * 2) {
                    return Date.now() > date ? "An hour ago" : "In an hour"
                } else if(date >= 1000 * 60 * 60 * 24 * 7 && date <= 1000 * 60 * 60 * 24 * 14) {
                    return Date.now() > date ? "A week ago" : "In a week"
                } else {
                    return `${Date.now() < time * 1000 ? "In " : ""}${years >= 1 ? `${years} year${years <= 1 ? "" : "s"}` : ""}${months >= 1 && months <= 12 ? `${months} month${months <= 1 ? "" : "s"}` : ""}${days >= 1 && days <= 30 ? `${days} day${days <= 1 ? "" : "s"}` : ""}${hours >= 1 && hours <= 24 ? `${hours} hour${hours <= 1 ? "" : "s"}` : ""}${minutes >= 1 && minutes <= 60 ? `${minutes} minute${minutes <= 1 ? "" : "s"}` : ""}${seconds >= 1 && seconds <= 60 ? `${seconds} second${seconds <= 0 ? "" : "s"}` : ""}${Date.now() > time * 1000 ? " ago" : ""}`
                }
            }
        }
    }
    async startMongo(mongoDB: string, mongoCollection: string, options?: { uri: string}): Promise<mongoose.Collection<any>> {
        if(!process.env.MONGOPATH) throw new Error("You didn't specify a environment var for mongo")
        if(!mongoDB) throw new Error("Please make sure you specify a database name")
        if(options?.uri) {
            return new Promise((res, rej) => {
                let database: mongoose.Db
                mongoose.connect(options?.uri, { useUnifiedTopology: true, useNewUrlParser: true, maxIdleTimeMS: 3500}, (err, db) => {
                    if(err) rej("There's an error")
                    try {
                        database = db.db(mongoDB)
                        res(database.collection(mongoCollection))
                        if(count >= 1) {
                            return
                        } else {
                            count++
                            console.log("Connected")
                        }
                    } finally {
                        setTimeout(async () => {
                            await db.close()
                            console.log("DB has been closed")
                            count = 0
                        }, 1000 * 60 * 2)
                    }
                })
            })
        } else {
            return new Promise((res, rej) => {
                let database: mongoose.Db
                mongoose.connect(process.env.MONGOPATH, { useUnifiedTopology: true, useNewUrlParser: true, maxIdleTimeMS: 3500}, (err, db) => {
                    if(err) rej("There's an error")
                    try {
                        database = db.db(mongoDB)
                        res(database.collection(mongoCollection))
                        if(count >= 1) {
                            return
                        } else {
                            count++
                            console.log("Connected")
                        }
                    } finally {
                        setTimeout(async () => {
                            await db.close()
                            console.log("DB has been closed")
                            count = 0
                        }, 1000 * 60 * 2)
                    }
                })
            })
        }
    }
    /**
     * A handler for slash commands in Discord
     * @param guildID - The guild ID you want this slash commands to be created on
     * @param options - Options for slash commands
     */
    async slashHandler(guildID: string, options: { slashCommandDir: string}) {
        if(!options) throw new Error("Please specify a dir for your slash")
        if(typeof options?.slashCommandDir !== "string") throw new TypeError(`Type of slashDir must be type string but received=${typeof options?.slashCommandDir}`)
        if(!/^(.\/|..\/)/gim.test(options?.slashCommandDir)) throw new Error("Please specify a valid file path, must start with ./ or ../")
        if(this.client?.readyAt) {
            if(guildID && /\d{17,18}/gim.test(guildID)) {
                let guild = this.client.guilds.cache.get(typeof guildID === "number" ? `${guildID}` : guildID)
                let commands = fs.readdirSync(options?.slashCommandDir).filter(js => js.endsWith(".js"))
                for(let file of commands) {
                    let command = require(`${options?.slashCommandDir}/${file}`)
                    let data = {
                        name: command?.name,
                        description: command?.description ?? "No description Found",
                        options: Array.isArray(command?.options) ? command?.options : new TypeError(`slash options must be type array but received=${typeof command?.options}`)
                    }
                    if(command?.slash) {
                        if(!(await guild?.commands.fetch()).some(val => val.name === command?.name)) {
                            await guild?.commands.create(data)
                            console.log(`Loaded command name ${command?.name}`)
                        }
                        MyCollection.set(command.name, command)
                        if(command?.permissions && Array.isArray(command?.permissions)) {
                            let validPerm = true
                            for(let i = 0; i < command?.permissions.length; i++) {
                                if(!/\d{17,18}/gim.test(command?.permissions[i].id)) validPerm = false
                            }
                            if(!validPerm) throw new Error("User/Role ID must be 17,18 in length or a valid User/Role ID")
                            let perms = await guild?.commands.fetch()
                            for(let [key, val] of perms) {
                                await val.setPermissions(command?.permissions)
                            }
                        } else if(!Array.isArray(command?.permissions) && command?.permissions) {
                            throw new TypeError("Permissions must be type array")
                        }
                    }
                }
                this.client.on("interaction", (interaction: Interaction) => {
                    if(interaction.type === "MESSAGE_COMPONENT") return this.client.ws.emit("Buttons", interaction)
                    if(interaction.isCommand()) {
                        if(MyCollection.size > 0) {
                            let filter = MyCollection.filter(slash => slash === interaction?.commandName)
                            if(!filter.first().permissions?.some(role => role.type.toLowerCase() === "role" ? interaction?.member.roles.cache.has(role.id) : interaction?.member.id === role.id) && filter.first().hasOwnProperty("permissions")) return interaction.reply("Invalid Access", { ephemeral: true})
                            filter.first().execute(interaction, this.client, this)
                        }
                    }
                })
            } else if(!/\d{17,18}/gim.test(guildID)) {
                throw new Error(`guildID must contain 17,18 length instead received=${guildID?.length}`)
            } else {
                throw new Error("Please specify a guild ID")
            }
        }
    }
}

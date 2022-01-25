import { 
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  createAudioResource
} from '@discordjs/voice'
import path from 'path'
import ytdl from 'ytdl-core'
import Queue from 'bull'
import search from 'youtube-search'
import { google } from 'googleapis'

import type { Queue as QueueType } from 'bull'
import type { DiscordGatewayAdapterCreator, AudioPlayer, VoiceConnection } from '@discordjs/voice'
import type { createVoiceSessionConfig, voiceSessionStore } from 'global'

const { playlistItems } = google.youtube('v3')

export default class {
  channelId: string
  guildId: string
  connection: VoiceConnection | undefined
  adapterCreator: DiscordGatewayAdapterCreator
  player: AudioPlayer = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } })
  queue: QueueType<{ input: string }>

  constructor (options: createVoiceSessionConfig) {
    this.channelId = options.channelId
    this.guildId = options.guildId
    this.adapterCreator = options.adapterCreator
    this.queue = new Queue(options.channelId, { redis: { port: 6379, host: "127.0.0.1" } })
    sessions[options.guildId] = this
  }

  async join() {
    joinVoiceChannel({
      channelId: this.channelId,
      guildId: this.guildId,
      adapterCreator: this.adapterCreator
    })
    await this.queue.empty()
    this.connection = getVoiceConnection(this.guildId)
    this.queue.process(this.guildId, ({ data }) => {
      const resource = createAudioResource(
        data.input.match(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi) ?
        ytdl(data.input, { filter: 'audioonly' }) :
        path.resolve(data.input)
      )
      if (this.connection === undefined) return Promise.resolve()
      console.log("connection valid")
      const sub = this.connection.subscribe(this.player)
      if (sub === undefined) return Promise.resolve()
      console.log("subscribed")
      this.player.play(resource)
      console.log("Playing", data.input)
      this.player.once(AudioPlayerStatus.Playing, () => {
        console.log("Started index", data.input)
        this.player.once(AudioPlayerStatus.Idle, () => {
          console.log("Finished index", data.input)
          sub.unsubscribe()
          Promise.resolve()
        })
      })
    })
    // this.queue.on("completed", async (job) => {
    //   console.log("Finished", job.data.input)
    //   console.log(await this.queue.count(), "items left")
    //   this.queue.count().then(c => c === 0 ? this.leave() : void 0)
    // })
  }

  async leave() {
    try {
      const connection = this.connection
      console.log("Leaving", this.guildId)
      if (connection !== undefined) connection.destroy()
      await this.queue.close()
      sessions[this.guildId] = void 0
    } catch { void 0 }
  }

  async getStatus(): Promise<VoiceConnectionStatus> {
    const connection = this.connection
    if (connection === undefined) return VoiceConnectionStatus.Disconnected
    return connection.state.status
  }

  playFile(file: string) {
    this.queue.add(this.guildId, { input: file })
  }

  async play(url: string) {
    if (url.match(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi)) {
      const filter = url.split(/(\?list\=|\&list\=|\&index\=)/ig)
      if (filter.length === 1) this.queue.add(this.guildId, { input: url }, { removeOnComplete: true })
      else {
        const videos: string[] = []
        let nextPageToken: string | undefined
        do {
          await new Promise(res => {
            playlistItems.list({ key: process.env.KEY, part: ["id","snippet"], playlistId: filter[2], maxResults: 50, pageToken: nextPageToken }, (e?: any, r?:any) => {
              if (e) throw e
              for (const video of r.data.items) { videos.push(`https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`) }
              nextPageToken = r.data.nextPageToken
              res(null)
            })
          })
        } while (nextPageToken)
        console.log(`Adding ${videos.length} videos to queue`)
        //this.queue.add(this.guildId,{ input: videos[0] }, { removeOnComplete: true })
        for (const video of videos) { this.queue.add(this.guildId,{ input: video }) }
      }
    }
    else search(url, { maxResults: 1, type: "video", key: process.env.KEY }, (err, results) => {
      if (err) throw err
      if (!results) return
      this.queue.add(this.guildId, { input: results[0].link }, { removeOnComplete: true })
    })
  }

  togglePause() {
    this.player.state.status === AudioPlayerStatus.Playing 
    ? this.player.pause()
    : this.player.unpause()
  }

  stop() {
    this.player.stop()
  }
}

export const sessions: voiceSessionStore = {}
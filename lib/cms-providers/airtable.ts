/**
 * Copyright 2020 Twilio Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */

const Airtable = require('airtable');

import { Base } from 'airtable';
import { Job, Speaker, Sponsor, Stage } from '../types';

Airtable.configure({ apiKey: process.env.AIRTABLE_API_TOKEN });
const base: Base = Airtable.base(process.env.AIRTABLE_BASE_ID);

export async function getAllSpeakers(): Promise<Speaker[]> {
  const lst: Speaker[] = [];

  const [speakers, sessions] = await Promise.all([
    base('Speakers').select().all(),
    base('Sessions').select({ view: 'Upcoming Sessions' }).all()
  ]);

  speakers.forEach((speaker: any) => {
    const talks: any = sessions
      .filter((session: any) => session.get('Speakers').includes(speaker.id))
      .map((talk: any) => {
        return {
          title: talk.get('Session Name'),
          description: talk.get('Session Description'),
          start: talk.get('Start Time'),
          end: talk.get('End Time'),
          speaker: speakers
            .filter((speaker: any) => talk.get('Speakers').includes(speaker.id))
            .map((speaker: any) => {
              return {
                name: speaker.get('Name'),
                slug: speaker.get('Email'),
                image: {
                  url: `${speaker.get('Pic')[0].url}`
                }
              };
            })
        };
      })[0]; // get the first talk only to match API
    lst.push({
      name: speaker.get('Name'),
      title: speaker.get('Title / Role'),
      bio: speaker.get('Bio'),
      slug: speaker.get('Email'),
      twitter: speaker.get('Twitter'),
      github: speaker.get('Github'),
      company: speaker.get('Organization'),
      image: {
        url: `${speaker.get('Pic')[0].url}`
      },
      imageSquare: {
        url: `${speaker.get('Pic')[0].thumbnails.small.url}`
      },
      talk: talks
    });
  });
  return lst.sort((a, b) => (a.name > b.name ? 1 : -1));
}

export async function getAllStages(): Promise<Stage[]> {
  const lst: Stage[] = [];

  const [stages, speakers, sessions] = await Promise.all([
    base('Events').select({ view: 'Upcoming Events' }).all(),
    base('Speakers').select().all(),
    base('Sessions').select({ view: 'Upcoming Sessions' }).all()
  ]);

  stages.forEach((stage: any) => {
    const schedule: any[] = sessions
      .filter((s: any) => s.get('Events').includes(stage.id))
      .sort((a: any, b: any) => (a.get('Start Time') > b.get('Start Time') ? 1 : -1))
      .map((talk: any) => {
        return {
          title: talk.get('Session Name'),
          description: talk.get('Session Description'),
          start: talk.get('Start Time'),
          end: talk.get('End Time'),
          speaker: speakers
            .filter((s: any) => talk.get('Speakers').includes(s.id))
            .map((speaker: any) => {
              return {
                name: speaker.get('Name'),
                slug: speaker.get('Email'),
                image: {
                  url: `${speaker.get('Pic')[0].url}`
                }
              };
            })
        };
      });
    lst.push({
      name: stage.get('Event Name'),
      slug: stage.get('ID'),
      stream: stage.get('Stream'),
      discord: stage.get('Discord'),
      schedule
    });
  });
  return lst;
}

export async function getAllSponsors(): Promise<Sponsor[]> {
  const lst: Sponsor[] = [];

  const [sponsors, resources] = await Promise.all([
    base('Sponsors').select({ view: 'Active Sponsors' }).all(),
    base('Resources').select({ view: 'Published Resources' }).all()
  ]);

  sponsors.forEach((sponsor: any) => {
    const links: any[] = resources.filter((resource: any) => resource.get('Sponsor').includes(sponsor.id))
      .map((rsrc: any) => {
        return {
          url: rsrc.get('Link'),
          text: rsrc.get('Description')
        }
      });
    lst.push({
      name: sponsor.get('Name'),
      discord: sponsor.get('Discord'),
      slug: sponsor.id,
      website: sponsor.get('Website'),
      callToAction: sponsor.get('Call To Action'),
      callToActionLink: sponsor.get('CTA Link'),
      youtubeSlug: sponsor.get('Youtube Ref'),
      tier: sponsor.get('Tier'),
      description: sponsor.get('Description'),
      cardImage: {
        url: `${sponsor.get('Card Image')[0].url}`
      },
      logo: {
        url: `${sponsor.get('Logo Image')[0].url}`
      },
      links
    });
  });
  return lst;
}

export async function getAllJobs(): Promise<Job[]> {
  const jobs = await base('Jobs').select({ view: 'Open Positions' }).all();

  return jobs
    .map((job: any) => {
      return {
        id: job.id,
        companyName: job.get('Company Name'),
        title: job.get('Title'),
        description: job.get('Description'),
        discord: job.get('Discord'),
        link: job.get('Link'),
        rank: job.get('Rank')
      };
    })
    .sort((a: any, b: any) => (a.rank > b.rank ? 1 : -1));
}

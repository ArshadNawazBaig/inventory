import { Module } from '@nestjs/common';
import { isMongo, mongoFeature } from '../persistence';
import { COUNTER_MODEL, CounterSchema } from './counter.schema';
import { MongoCounters } from './counters';

/**
 * Provides the shared `MongoCounters` sequence generator in mongo mode (registers the `counters` model and
 * exports the generator); contributes nothing in memory mode, where in-memory repos keep their own counters.
 * Order modules import this; Nest dedupes so the model is registered once on the connection.
 */
@Module({
  imports: [...mongoFeature([{ name: COUNTER_MODEL, schema: CounterSchema }])],
  providers: isMongo() ? [MongoCounters] : [],
  exports: isMongo() ? [MongoCounters] : [],
})
export class CountersModule {}

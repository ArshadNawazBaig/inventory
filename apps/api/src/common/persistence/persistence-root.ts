import { type DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigService } from '../../config';
import { isMongo } from './persistence';

/**
 * The root Mongoose connection, imported once by AppModule. Opens a single pooled connection from
 * `MONGODB_URI` in mongo mode; contributes nothing in memory mode (so the app boots with no database).
 * Connection lifecycle (incl. graceful close) is handled by `@nestjs/mongoose` + `enableShutdownHooks`.
 */
export function mongoRoot(): DynamicModule[] {
  if (!isMongo()) return [];
  return [
    MongooseModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const uri = config.mongoUri;
        if (!uri) {
          throw new Error('PERSISTENCE_DRIVER=mongo requires MONGODB_URI to be set');
        }
        return { uri };
      },
    }),
  ];
}

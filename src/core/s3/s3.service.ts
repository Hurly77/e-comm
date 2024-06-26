import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  // Upload file to S3
  public async uploadFileToS3(file: Express.Multer.File, options: { path: string; bucket: string }) {
    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.path,
      Body: file.buffer,
      ACL: 'bucket-owner-full-control',
      ContentType: file.mimetype,
    });

    try {
      // Using lib-storage to handle the upload
      const upload = new Upload({
        client: this.s3Client,
        params: command.input,
      });

      const result = await upload.done();
      return result;
    } catch (error) {
      console.error(error);
      return error as Error;
    }
  }

  // Delete file from S3
  public async deleteFileFromS3(options: { key: string; bucket: string }) {
    const command = new DeleteObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    try {
      const result = await this.s3Client.send(command);
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Get file from S3
  public async getFileFromS3(options: { path: string; bucket: string }) {
    const command = new GetObjectCommand({
      Bucket: options.bucket,
      Key: options.path,
    });

    try {
      const result = await this.s3Client.send(command);
      // For demonstration, returning the result directly
      // In practice, you might want to handle streaming the data depending on the file type
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  public async getSignedUrl(options: { key: string; bucket: string }) {
    const command = new GetObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async listObjects(bucket: string): Promise<string[]> {
    const objects: string[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command);
      if (response.Contents) {
        response.Contents.forEach((item) => {
          if (item.Key) {
            objects.push(item.Key);
          }
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  }

  async deleteObjects(bucket: string, keys: string[]): Promise<void> {
    const chunks = [];
    const chunkSize = 1000;

    for (let i = 0; i < keys.length; i += chunkSize) {
      chunks.push(keys.slice(i, i + chunkSize));
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        const command = new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: chunk.map((key) => ({ Key: key })),
          },
        });

        await this.s3Client.send(command);
      }),
    );
  }

  async emptyBucket(bucket: string): Promise<void> {
    const keys = await this.listObjects(bucket);
    if (keys.length > 0) {
      await this.deleteObjects(bucket, keys);
    }
  }

  // In AWS SDK for JavaScript v3, error handling is done through try/catch blocks
  // The specialized error handling functions from v2 are no longer necessary
}

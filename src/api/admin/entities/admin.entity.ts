import { Exclude } from 'class-transformer';
import { AuthRole } from 'src/types/enums';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  first_name: string;
  @Column()
  last_name: string;
  @Column()
  email: string;

  @Exclude()
  @Column()
  password: string;
  @Column('enum', { enum: AuthRole })
  role: string;
}

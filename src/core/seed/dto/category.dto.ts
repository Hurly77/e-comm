export class SeedCategory {
  id: string;
  catPathName: string;
  name: string;
  parent: SeedCategory | null;
}

export class SeedCategoryImg {
  id: string;
  img: string;
  url: string;
}
